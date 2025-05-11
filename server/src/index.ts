import { LoveController, simulateLove } from './love'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer, Server } from 'http'
import { selectProvider } from './cli'
import { boysArray, girlsArray, Lover, riku, starters, yumi } from './lovers'
import { LLMProvider } from './llm'
import { isEnglishAlphabetAnalysis, isEnglishPairAnalysis, randomInt, textSimilarity } from './util'

const port = 3001
type Message = {
  content: string,
  senderName: string
}
type PacketType = 'init' | 'message' | 'notification' | 'start-vote' | 'end-vote' | 'progress-vote' | 'choice-vote'
type NotificationColor = 'green' | 'pink' | 'yellow'
const MAX_HISTORY = 300

class State {
  private llm: LLMProvider
  private httpServer: Server
  private history: Message[] = []
  private clients: Set<WebSocket> = new Set<WebSocket>()
  public readonly running: boolean = true
  public girl?: Lover
  public boy?: Lover
  private vote?: Vote

  constructor(llm: LLMProvider) {
    this.llm = llm
    this.httpServer = createServer()
  }

  createInitPacketData(): any {
    if (!this.girl || !this.boy)
      throw new Error("createInitPacketData must only be called with a boy and girl in state");
    return {
      girl: this.girl,
      boy: this.boy,
      history: this.history
    }
  }

  broadcast(type: PacketType, data: any) {// we could techincally make joined package with proto defs but thats over engineering
    const messageStr = JSON.stringify({
      type: type,
      data
    })

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  broadcastNotification(text: string, color: NotificationColor = 'pink') {
    this.broadcast('notification', {
      text,
      color
    })
  }

  runSync() {
    this.loveLoop()
    this.httpServer.listen(port, () => {// this is sync - dont forget
      console.log(`\x1b[195mai's are loving on ws://localhost:${port}\x1b[0m`)
    })
    const wss = new WebSocketServer({ server: this.httpServer })
    wss.on('connection', (ws) => {
      this.clients.add(ws)

      ws.on('message', (message) => {
        const data = JSON.parse(message.toString())
        console.log("data", data);
        if (data.type === 'choice-vote' && this.vote) {
          this.vote.onChoicePacket(ws, data.data)
        }
      })

      if (this.girl && this.boy) {
        ws.send(JSON.stringify({
          type: 'init',
          data: this.createInitPacketData()
        }))
      }

      ws.on('close', () => {
        this.clients.delete(ws)
      })
    })
  }

  async loveLoop() {
    // start the loop
    while (this.running) {
      const girl = girlsArray[randomInt(0, girlsArray.length - 1)];
      const boy = boysArray[randomInt(0, boysArray.length - 1)];
      this.girl = girl
      this.boy = boy
      this.history = [];
      this.vote = undefined;
      this.broadcast('init', this.createInitPacketData())
      this.broadcastNotification(`found a new match! ${this.girl?.name.toLowerCase()} and ${this.boy?.name.toLowerCase()}!`, 'yellow')

      const controller = new LoveController()
      // called by the message handler when something is wrong 
      // with the llm's and we wanna restart
      // like when the bots get into an infinite glazing loop or cya later loop
      const stop = (reason: string, color: NotificationColor = 'pink') => {
        controller.stop();
        this.broadcastNotification(`Finding a new match! (${reason})`, color);
      }
      const stopFullReason = (reason: string, color: NotificationColor = 'pink') => {
        controller.stop();
        this.broadcastNotification(reason, color);
      }

      // we will store the previous levenhstein distances
      // so we can determine if the llms are just saying the same thing to each other
      let previousDistances = []
      let prevMessageTime = Number.MAX_VALUE;// ollama needs to load up, so first message might be slow
      let recursiveAverageLatency = 0;

      const onMessage = (message: string, senderName: string) => {
        const messageObj: Message = { content: message, senderName }

        // let's get stats for if the message is 'bad'
        const wordCount = messageObj.content.split(' ').length
        const emojiCount = (messageObj.content.match(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu) || []).length
        let avgPrevDistance = 0
        if (this.history.length > 0) {
          const distance = textSimilarity(messageObj.content, this.history[this.history.length - 1].content)
          previousDistances.push(distance)
          if (previousDistances.length > 6) {
            previousDistances.shift()
            avgPrevDistance = previousDistances.reduce((sum, val) => sum + val, 0) / previousDistances.length
          }
        }
        let englishAlphabetAnalysis = true;
        let englishPairAnalysis = true;
        if (this.history.length >= 8) {
          let sumOfHistory = "";
          for (let i = 0; i < 8; i++) {
            sumOfHistory += this.history[this.history.length - 1 - i].content;
          }
          englishAlphabetAnalysis = isEnglishAlphabetAnalysis(sumOfHistory)
          englishPairAnalysis = isEnglishPairAnalysis(sumOfHistory);
        }

        // update recursive latency avg
        const latency = Math.max(Date.now() - prevMessageTime, 0);
        recursiveAverageLatency = (recursiveAverageLatency + latency) / 2;

        if (wordCount > 80)
          stop('too much goddamn yapping!')
        else if (emojiCount > 20)
          stop('they became stupid braindead... (too much emojis)')
        else if (avgPrevDistance > 0.7)
          stop('stupid llm\'s got possessed (response loop)...')
        else if (recursiveAverageLatency >= 15000)
          stop('someone got ghosted (high llm latency)...')
        else if (!englishAlphabetAnalysis || !englishPairAnalysis)
          stop('dumbass llm\'s are speaking hieroglyphics (u live in america!!)')
        prevMessageTime = Date.now();

        this.history.push(messageObj)
        if (this.history.length > MAX_HISTORY) {
          this.history.shift()
        }
        this.broadcast('message', messageObj)

        // let's start a vote if this is the 15th message
        if (this.history.length === 10 || this.history.length === 30) {
          this.vote = new Vote({
            state: this,
            choices: ["continue!!", "skip, they're chopped 😭"],
            question: `should we skip ${this.girl?.name.toLowerCase()} and ${this.boy?.name.toLowerCase()}? r they not meant to be?`,
            durationMs: 7500,
            onComplete: (choices, results) => {
              const continues = results[choices[0]]
              const skips = results[choices[1]]
              if (continues >= skips) {
                this.broadcastNotification(`vote failed: ${this.girl?.name.toLowerCase()} and ${this.boy?.name.toLowerCase()} are continuing!`, 'green')
                return
              }
              stopFullReason(`vote complete: ${this.girl?.name.toLowerCase()} and ${this.boy?.name.toLowerCase()} are getting skipped! finding a new match...`, 'green')
            }
          })
          this.vote.run()
        }
      }
      const params = {
        llm: this.llm,
        girl,
        boy,
        startMessage: starters[randomInt(0, starters.length - 1)],
        temperature: randomInt(0.05, 0.6),
        onMessage,
        controller
      }
      await simulateLove(params).catch((err) => {
        console.error(err)
      });
    }
  }
}

type VoteParams = {
  state: State
  choices: string[]
  question: string,
  durationMs: number,
  onComplete: (choices: string[], results: Record<string, number>) => void
}

class Vote {
  private state: State
  private votes: Map<WebSocket, string> = new Map<WebSocket, string>()
  public readonly choices: string[]
  public readonly question: string
  private running = false
  private timeout?: NodeJS.Timeout
  private durationMs: number
  private onComplete: (choices: string[], results: Record<string, number>) => void

  constructor(params: VoteParams) {
    this.state = params.state
    this.choices = params.choices
    this.question = params.question
    this.durationMs = params.durationMs
    this.onComplete = params.onComplete
  }

  public run() {
    if (!this.state.boy || !this.state.girl)
      throw new Error("runVote called with no boy or girl in state?");
    this.running = true;
    this.state.broadcast('start-vote', {
      question: this.question,
      choices: this.choices,
      durationMs: this.durationMs
    })
    this.timeout = setTimeout(() => {
      if (!this.running)
        return;
      const results = this.getResults()
      this.state.broadcast('end-vote', {
        result: results
      })
      this.running = false;
      this.onComplete(this.choices, results)
    }, this.durationMs)
  }

  public stop() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = undefined
    }
    this.running = false;
  }

  public getResults() {
    const votes = Array.from(this.votes.values())
    const results: Record<string, number> = {}
    this.choices.forEach(choice => {
      results[choice] = 0
    })
    votes.forEach(vote => {
      results[vote]++
    })
    return results
  }

  public onChoicePacket(socket: WebSocket, data: any) {
    if (!this.running)
      return;
    const choice = data as string
    if (!this.choices.includes(choice)) {
      return;
    }

    const originalVote = this.votes.get(socket)
    if (originalVote === choice) {
      return;
    }

    this.votes.set(socket, choice)
    this.state.broadcast('progress-vote', {
      result: this.getResults()
    })
  }
}

selectProvider().then((llm) => {
  new State(llm).runSync()
}).catch(console.error)