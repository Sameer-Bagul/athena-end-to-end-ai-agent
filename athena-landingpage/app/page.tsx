import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Shield,
  Zap,
  Cpu,
  MessageSquare,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Terminal,
  Activity,
  ChevronRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      {/* Background Tech Layer */}
      <div className="fixed inset-0 industrial-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="size-6 border border-white flex items-center justify-center">
              <div className="size-2 bg-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.5em]">Athena.OS</span>
          </div>
          <div className="hidden md:flex items-center gap-12">
            <a href="#features" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Protocol</a>
            <a href="#vision" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Neural</a>
            <a href="#stack" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Stack</a>
          </div>
          <Button variant="outline" className="rounded-none border-white/10 hover:border-white h-10 px-6 text-[10px] uppercase tracking-widest leading-none">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative z-10 flex flex-col gap-8">
              <Badge variant="outline" className="w-fit rounded-none border-white/20 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] font-bold">
                Version 1.0.4 Early Access
              </Badge>
              <h1 className="text-6xl md:text-8xl font-black uppercase tracking-[-0.04em] leading-[0.9] text-glow">
                Neural <br /> Interface // <br /> <span className="text-white/20">Athena</span>
              </h1>
              <p className="max-w-md text-lg text-white/40 leading-relaxed font-medium">
                The first professional-grade desktop OS for intelligent document interaction. 3D Avatar technology meets high-performance RAG pipelines.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button className="h-14 px-8 rounded-none bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest group">
                  Download for Linux
                  <Download className="ml-3 size-4 group-hover:translate-y-0.5 transition-transform" />
                </Button>
                <Button variant="outline" className="h-14 px-8 rounded-none border-white/10 hover:border-white text-xs font-bold uppercase tracking-widest">
                  View Source Code
                </Button>
              </div>
              <div className="flex flex-col gap-3 mt-12 border-l border-white/10 pl-6">
                <div className="flex items-center gap-3">
                  <Activity className="size-3 text-white/40" />
                  <span className="text-[9px] uppercase tracking-widest text-white/20">System Status: Nominal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Cpu className="size-3 text-white/40" />
                  <span className="text-[9px] uppercase tracking-widest text-white/20">Latency: 12ms (Local)</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-square lg:aspect-auto lg:h-[700px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />
              <div className="relative w-full h-full border border-white/5 bg-white/[0.02] p-2">
                <Image
                  src="/assets/images/athena_hero.png"
                  alt="Athena AI Avatar"
                  fill
                  className="object-cover grayscale brightness-125"
                  priority
                />
                <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                  <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/40">Model: Athena-01</span>
                  <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/40">Rig: High-Fidelity Facial</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Matrix */}
        <section id="features" className="py-32 border-t border-white/5 bg-white/[0.01]">
          <div className="container mx-auto px-6">
            <div className="flex flex-col gap-4 mb-20 text-center items-center">
              <Label className="text-[10px] uppercase tracking-[0.5em] text-white">The Core Engine</Label>
              <h2 className="text-4xl md:text-6xl font-black uppercase italic">Mastering Context.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
              {[
                {
                  title: "RAG Pipeline",
                  desc: "Advanced Retrieval-Augmented Generation. Ingest PDFs and documents into accurate vector-based contextual memory.",
                  icon: <Layers className="size-6" />
                },
                {
                  title: "VRM Avatar",
                  desc: "High-fidelity 3D avatars with real-time facial expressions, lip-syncing, and procedural limb movement.",
                  icon: <Cpu className="size-6" />
                },
                {
                  title: "Industrial UI",
                  desc: "Strictly monochrome, minimalist interface designed for elite productivity and visual focus.",
                  icon: <Terminal className="size-6" />
                },
                {
                  title: "Local STT",
                  desc: "Ultra-fast local speech recognition via Whisper integration. No cloud processing, absolute privacy.",
                  icon: <Shield className="size-6" />
                },
                {
                  title: "Dynamic Staging",
                  desc: "3D stage with real-time lighting, camera management, and interactive staging tools.",
                  icon: <Zap className="size-6" />
                },
                {
                  title: "Voice Sync",
                  desc: "Hyper-realistic TTS synthesis synchronized perfectly with avatar lip-rigging in near-zero latency.",
                  icon: <MessageSquare className="size-6" />
                }
              ].map((f, i) => (
                <div key={i} className="group p-10 border border-white/5 hover:border-white/20 transition-all flex flex-col gap-6 bg-black">
                  <div className="size-12 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight italic">{f.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">
                    Detail Report <ArrowUpRight className="size-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* UI Preview Section */}
        <section className="py-48 bg-black relative">
          <div className="container mx-auto px-6 flex flex-col items-center">
            <div className="max-w-5xl w-full border border-white/10 p-4 bg-white/[0.02] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-60" />
              <div className="relative aspect-video w-full">
                <Image
                  src="/assets/images/athena_ui_preview.png"
                  alt="Athena Workspace UI"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-12 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                  <div className="flex flex-col gap-4">
                    <Badge className="bg-white text-black rounded-none w-fit font-bold uppercase tracking-widest text-[10px]">Interface V2</Badge>
                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Industrial Precision</h3>
                    <p className="max-w-md text-white/60 text-sm">
                      Every line, every pixel is calibrated for the professional user. A symmetric, resizable, and completely monochrome environment.
                    </p>
                  </div>
                  <Button className="h-14 px-10 rounded-none bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-xs">Explore Interface</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Download */}
        <section className="py-32 border-y border-white/5 industrial-grid">
          <div className="container mx-auto px-6 flex flex-col items-center text-center gap-12">
            <div className="flex flex-col gap-4">
              <div className="text-[11px] font-black uppercase tracking-[0.8em] text-white/30">Deployment Readiness</div>
              <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic">Join the Engine.</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-8 max-w-2xl">
              <div className="flex flex-col items-center gap-6 p-8 border border-white/10 hover:border-white transition-all bg-black min-w-[300px]">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/20">Linux Distribution</div>
                <Download className="size-10 text-white" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xl font-black uppercase tracking-tight">Athena_OS.zip</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30">Stable Build // 224MB</div>
                </div>
                <Button className="w-full h-12 bg-white text-black hover:bg-white/90 uppercase font-black tracking-widest text-[10px] rounded-none">Download App</Button>
              </div>

              <div className="flex flex-col items-center gap-6 p-8 border border-white/10 opacity-40 hover:opacity-100 transition-all bg-black min-w-[300px]">
                <div className="text-[9px] font-bold uppercase tracking-widest text-white/20">Mac OS (Coming Soon)</div>
                <Shield className="size-10 text-white/60" />
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xl font-black uppercase tracking-tight italic">Secure Build</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/30">Apple Silicon Optimized</div>
                </div>
                <Button disabled className="w-full h-12 bg-transparent border border-white/10 text-white/10 uppercase font-black tracking-widest text-[10px] rounded-none uppercase">Waitlist</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="size-5 border border-white flex items-center justify-center">
                <div className="size-1.5 bg-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">Athena.OS</span>
            </div>
            <p className="text-[10px] uppercase tracking-widest leading-loose text-white/20">
              Proprietary neural platform. <br />
              Engineered for precision. <br />
              Powered by local models.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">System</h4>
            <div className="flex flex-col gap-3 text-[10px] font-medium text-white/30 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">Security Audit</a>
              <a href="#" className="hover:text-white transition-colors">API Keys</a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Company</h4>
            <div className="flex flex-col gap-3 text-[10px] font-medium text-white/30 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Service Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact Node</a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white md:text-right">Deployment Phase</h4>
            <div className="flex flex-col gap-2 md:items-end">
              <Badge variant="outline" className="rounded-none border-white/20 text-[9px] uppercase tracking-widest px-3 py-1">Internal Alpha 0.4.1</Badge>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[9px] uppercase tracking-[0.4em] text-white/10 font-black">© 2026 Sameer Bagul // Neural Systems</span>
          <div className="flex gap-8">
            <Terminal className="size-4 text-white/10" />
            <Activity className="size-4 text-white/10" />
          </div>
        </div>
      </footer>
    </div>
  );
}
