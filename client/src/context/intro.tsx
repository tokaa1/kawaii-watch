import { createContext, useContext, useEffect, useState } from "react";

export const IntroVisibilityContext = createContext({
  show: false,
  setShow: (val: boolean) => { }
});
export function IntroVisibilityProvider({ children }: { children: any }) {
  const [show, setShow] = useState((localStorage.getItem('showingIntro') || 'true') === 'true');
  useEffect(() => {
    localStorage.setItem('showingIntro', show ? 'true' : 'false');
  }, [show]);

  return <IntroVisibilityContext.Provider value={{show, setShow}}>
    { children }
  </IntroVisibilityContext.Provider>
}
export const useIntroVisibility = () => {
  return useContext(IntroVisibilityContext);
}