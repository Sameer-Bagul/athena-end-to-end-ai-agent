import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Button } from "./ui/button";
import { Monitor, Cpu, Activity } from "lucide-react";

export function DebugDrawer() {
  return (
    <div className="fixed top-0 left-0 z-50 h-full">
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button variant="ghost" className="rounded-r-lg mt-6 ml-1 shadow-lg bg-black/60 hover:bg-cyan-700/80 border-cyan-400 border-l-4 animate-pulse">
            <Monitor className="mr-2 h-5 w-5 text-cyan-400" />
            Debug
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-black/90 border-cyan-400 border-l-4 shadow-2xl min-w-[320px] max-w-xs animate-in slide-in-from-left duration-300">
          <DrawerHeader>
            <DrawerTitle className="text-cyan-400 tracking-widest font-mono">DEBUG PANEL</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 text-cyan-200 font-mono text-xs space-y-2">
            <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> LLM: <span className="text-green-400">Online</span></div>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> TTS: <span className="text-green-400">Online</span></div>
            {/* Add more debug/status info here */}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
