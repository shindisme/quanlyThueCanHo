import { useState, useCallback } from "react";

export function useOnOff(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const turnOn = useCallback(() => setIsOpen(true), []);
  const turnOff = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen: isOpen,
    onOpen: turnOn,
    onClose: turnOff,
    onToggle: toggle,
    setIsOpen: setIsOpen,
  };
}
