import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { Upload, Play, Pause, ChevronLeft, Loader2, RotateCcw } from "lucide-react";
import { retargetAnimation } from "vrm-mixamo-retarget";
import { AVAILABLE_MODELS } from "../lib/models";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

// --- Types ---
interface FBXPlaygroundProps {
    onBack: () => void;
}

interface SceneProps {
    vrm: VRM | null;
    mixer: THREE.AnimationMixer | null;
    isPlaying: boolean;
}

// --- Components ---

const SceneContent = ({ vrm, mixer, isPlaying }: SceneProps) => {
    useFrame((_, delta) => {
        if (vrm) {
            vrm.update(delta);
        }
        if (mixer && isPlaying) {
            mixer.update(delta);
        }
    });

    return (
        <>
            <Grid infiniteGrid fadeDistance={10} sectionColor="#444" cellColor="#222" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} intensity={1} castShadow />
            <Environment preset="city" />
            <OrbitControls target={[0, 1, 0]} />
            <primitive object={vrm ? vrm.scene : new THREE.Group()} position={[0, 0, 0]} />
        </>
    );
};

const Header = ({
    onBack,
    selectedModelId,
    setSelectedModelId,
    onUpload
}: {
    onBack: () => void;
    selectedModelId: string;
    setSelectedModelId: (id: string) => void;
    onUpload: () => void;
}) => (
    <div className="h-16 border-b border-white/10 flex items-center px-6 gap-6 bg-black/40 backdrop-blur-md shrink-0 z-10 relative">
        <Button onClick={onBack} variant="ghost" size="icon" className="mr-2 hover:bg-white/10 text-white/70 hover:text-white">
            <ChevronLeft />
        </Button>

        <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                FBX Playground
            </h2>
            <p className="text-xs text-white/40 font-mono">VRM Animation Retargeting Lab</p>
        </div>

        <div className="flex-1" />

        <Button
            variant="secondary"
            size="sm"
            className="bg-white/10 border border-white/10 hover:bg-white/20 gap-2 text-white/90"
            onClick={onUpload}
        >
            <Upload className="size-4" />
            <span>Upload FBX</span>
        </Button>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <select
            className="bg-black/40 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-blue-500 hover:border-white/40 transition-colors cursor-pointer"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
        >
            {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>
            ))}
        </select>
    </div>
);

const EmptyStateOverlay = ({ onUpload }: { onUpload: () => void }) => (
    <div
        className="absolute top-24 left-6 p-6 bg-black/60 rounded-xl border border-white/10 cursor-pointer hover:bg-black/80 hover:border-blue-500/50 transition-all group z-10"
        onClick={onUpload}
    >
        <div className="flex items-center gap-4 text-white/50 group-hover:text-blue-200">
            <div className="p-3 rounded-full bg-white/5 group-hover:bg-blue-500/10">
                <Upload className="size-6" />
            </div>
            <div>
                <p className="font-medium text-white/80 group-hover:text-white">Upload Animation</p>
                <span className="text-xs">Drag & Drop or Click to Browse (.fbx)</span>
            </div>
        </div>
    </div>
);

const PlaybackControls = ({
    isPlaying,
    togglePlay,
    fbxName,
    onReset
}: {
    isPlaying: boolean;
    togglePlay: () => void;
    fbxName: string | null;
    onReset: () => void;
}) => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 pr-6 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl z-10">
        <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className={cn(
                "rounded-full size-12 transition-all",
                isPlaying ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" : "hover:bg-white/10 text-white"
            )}
        >
            {isPlaying ? <Pause className="fill-current size-5" /> : <Play className="fill-current size-5 ml-1" />}
        </Button>

        <div className="flex flex-col px-2">
            <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Current Clip</span>
            <span className="text-sm font-mono text-blue-200 max-w-[200px] truncate">
                {fbxName || "No Animation Loaded"}
            </span>
        </div>

        {fbxName && (
            <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                className="ml-2 size-8 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
                title="Reset Animation"
            >
                <RotateCcw className="size-4" />
            </Button>
        )}
    </div>
);

// --- Main Container ---

export function FBXPlayground({ onBack }: FBXPlaygroundProps) {
    const [selectedModelId, setSelectedModelId] = React.useState(AVAILABLE_MODELS[0].id);
    const [vrm, setVrm] = React.useState<VRM | null>(null);
    const [mixer, setMixer] = React.useState<THREE.AnimationMixer | null>(null);
    const [fbxName, setFbxName] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // 1. Load VRM
    React.useEffect(() => {
        const model = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
        if (!model) return;

        setIsLoading(true);
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        loader.load(`models/${model.file}`, (gltf) => {
            const vrmInstance = gltf.userData.vrm;
            if (vrmInstance) {
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.combineSkeletons(gltf.scene);
                vrmInstance.scene.rotation.y = Math.PI;
                setVrm(vrmInstance);
                setMixer(new THREE.AnimationMixer(vrmInstance.scene));
            }
            setIsLoading(false);
        }, undefined, (err) => {
            console.error(err);
            setError("Failed to load model");
            setIsLoading(false);
        });
    }, [selectedModelId]);

    // 2. Process FBX
    const processFBXFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.fbx')) return;
        if (!vrm || !mixer) {
            setError("Please wait for model to load first");
            return;
        }

        setFbxName(file.name);
        setIsLoading(true);
        setError(null);

        try {
            const url = URL.createObjectURL(file);
            const loader = new FBXLoader();
            const fbxGroup = await loader.loadAsync(url);

            // Ensure VRM is at 0,0,0
            vrm.scene.position.set(0, 0, 0);

            const retargetedClip = retargetAnimation(fbxGroup, vrm);

            if (retargetedClip) {
                mixer.stopAllAction();
                const action = mixer.clipAction(retargetedClip);
                action.reset();
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = true;
                action.play();
                setIsPlaying(true);
            } else {
                setError("Failed to retarget animation");
            }
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load FBX: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFBXFile(file);
    };

    const triggerUpload = () => document.getElementById('fbx-upload-input')?.click();

    const resetAnimation = () => {
        if (mixer) {
            mixer.stopAllAction();
            setIsPlaying(false);
            setFbxName(null);
        }
    };

    return (
        <div className="absolute inset-0 bg-[#0a0a10] text-white font-sans flex flex-col z-50">
            {/* Hidden Input */}
            <input
                type="file"
                id="fbx-upload-input"
                accept=".fbx"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFBXFile(file);
                    e.target.value = '';
                }}
            />

            <Header
                onBack={onBack}
                selectedModelId={selectedModelId}
                setSelectedModelId={setSelectedModelId}
                onUpload={triggerUpload}
            />

            <div
                className="flex-1 relative overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
                    <color attach="background" args={["#111"]} />
                    <SceneContent vrm={vrm} mixer={mixer} isPlaying={isPlaying} />
                </Canvas>

                {/* Overlays */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
                        <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
                            <Loader2 className="animate-spin text-blue-500 size-10" />
                            <span className="text-sm font-medium text-blue-200">Processing...</span>
                        </div>
                    </div>
                )}

                {!fbxName && !isLoading && <EmptyStateOverlay onUpload={triggerUpload} />}

                <PlaybackControls
                    isPlaying={isPlaying}
                    togglePlay={() => setIsPlaying(!isPlaying)}
                    fbxName={fbxName}
                    onReset={resetAnimation}
                />

                {error && (
                    <div className="absolute top-6 right-6 bg-red-500/10 text-red-200 px-4 py-3 rounded-lg border border-red-500/20 shadow-xl backdrop-blur-md animate-in slide-in-from-right-4 z-50 flex items-center gap-3">
                        <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-sm font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="hover:text-white ml-2">×</button>
                    </div>
                )}
            </div>
        </div>
    );
}
