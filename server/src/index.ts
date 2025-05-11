import { LoveController, simulateLove } from './love'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer, Server } from 'http'
import { selectProvider } from './cli'
import { boysArray, girlsArray, Lover, riku, yumi } from './lovers'
import { LLMProvider } from './llm'
import { randomInt, textSimilarity } from './util'

const port = 3001
type Message = {
  content: string,
  senderName: string
}
type PacketType = 'init' | 'message' | 'notification'
const MAX_HISTORY = 300

class State {
  private llm: LLMProvider
  private httpServer: Server
  private history: Message[] = []
  private clients: Set<WebSocket> = new Set<WebSocket>()
  public readonly running: boolean = true
  private girl?: Lover
  private boy?: Lover

  constructor(llm: LLMProvider) {
    this.llm = llm
    this.httpServer = createServer()
  }

  createInitPacketData(): any {
    if (!this.girl || !this.boy)
      throw new Error("createInitPacketData must only be called with a boy and girl in state");
    return {
      girl: this.girl.name,
      boy: this.boy.name,
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

  runSync() {
    this.loveLoop()
    this.httpServer.listen(port, () => {// this is sync - dont forget
      console.log(`\x1b[195mai's are loving on ws://localhost:${port}\x1b[0m`)
    })
    const wss = new WebSocketServer({ server: this.httpServer })
    wss.on('connection', (ws) => {
      this.clients.add(ws)

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
      this.broadcast('init', this.createInitPacketData())

      const controller = new LoveController()
      // called by the message handler when something is wrong 
      // with the llm's and we wanna restart
      // like when the bots get into an infinite glazing loop or cya later loop
      const stop = (reason: string) => {
        controller.stop();

        this.broadcast('notification', `Finding a new match! (${reason})`);
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

        // update recursive latency avg
        const latency = Math.max(Date.now() - prevMessageTime, 0);
        recursiveAverageLatency = (recursiveAverageLatency + latency) / 2;

        if (wordCount > 80)
          stop('Messages are getting too damn long!')
        if (emojiCount > 20)
          stop('They became braindead...')
        if (avgPrevDistance > 0.7)
          stop('They became NPC\'s...')
        if (recursiveAverageLatency >= 10000) {
          stop('Someone got ghosted...')
        }
        if (controller.stopped)
          return;
        prevMessageTime = Date.now();

        this.history.push(messageObj)
        if (this.history.length > MAX_HISTORY) {
          this.history.shift()
        }
        this.broadcast('message', messageObj)
      }
      const params = {
        llm: this.llm,
        girl,
        boy,
        startMessage: "hey gng",
        temperature: randomInt(0.05, 0.6),
        onMessage,
        controller
      }
      await simulateLove(params)
    }
  }
}

selectProvider().then((llm) => {
  new State(llm).runSync()
}).catch(console.error)