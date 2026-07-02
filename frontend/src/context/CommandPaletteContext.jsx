import { createContext, useContext, useState } from 'react';

const CommandPaletteContext = createContext(null);

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}
