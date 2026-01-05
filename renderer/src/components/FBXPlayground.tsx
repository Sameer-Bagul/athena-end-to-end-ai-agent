import * as React from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { Upload, Play, Pause, ChevronLeft, Loader2 } from "lucide-react";
import { retargetAnimation } from "vrm-mixamo-retarget";
import { AVAILABLE_MODELS } from "../lib/models";
import { Button } from "./ui/button";

interface FBXPlaygroundProps {
    onBack: () => void;
}

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

        const url = `models/${model.file}`;

        loader.load(url, (gltf) => {
            const vrmInstance = gltf.userData.vrm;
            if (vrmInstance) {
                VRMUtils.removeUnnecessaryVertices(gltf.scene);
                VRMUtils.combineSkeletons(gltf.scene);
                vrmInstance.scene.rotation.y = Math.PI; // Face camera
                setVrm(vrmInstance);

                // Setup Mixer
                const newMixer = new THREE.AnimationMixer(vrmInstance.scene);
                setMixer(newMixer);
            }
            setIsLoading(false);
        }, undefined, (err) => {
            console.error(err);
            setError("Failed to load model");
            setIsLoading(false);
        });

    }, [selectedModelId]);

    // Animation Loop
    React.useEffect(() => {
        let frameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (vrm) {
                vrm.update(delta);
            }
            if (mixer && isPlaying) {
                mixer.update(delta);
            }
        };
        animate();

        return () => cancelAnimationFrame(frameId);
    }, [vrm, mixer, isPlaying]);

    // Shared FBX Loader Logic
    const processFBXFile = async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.fbx')) return;

        if (!vrm || !mixer) {
            setError("Please wait for model to load first");
            return;
        }

        setFbxName(file.name);
        setIsLoading(true);

        try {
            const url = URL.createObjectURL(file);
            const loader = new FBXLoader();

            const fbxGroup = await loader.loadAsync(url);

            // Use vrm-mixamo-retarget library
            const retargetedClip = retargetAnimation(fbxGroup, vrm);

            if (retargetedClip) {
                console.log("Retargeted Clip:", retargetedClip);

                mixer.stopAllAction();
                const action = mixer.clipAction(retargetedClip);

                // Fix looping "snap back" glitch
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

    // Handle FBX Upload
    const handleFBXDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) processFBXFile(file);
    };

    return (
        <div className="absolute inset-0 bg-[#0a0a10] text-white font-sans flex flex-col z-50">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 gap-6 bg-black/20 backdrop-blur-md shrink-0">
                <Button onClick={onBack} variant="ghost" size="icon" className="mr-2">
                    <ChevronLeft />
                </Button>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    FBX Playground
                </h2>

                <div className="flex-1" />

                <input
                    type="file"
                    id="fbx-upload-header"
                    accept=".fbx"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processFBXFile(file);
                        // Reset input so same file can be selected again
                        e.target.value = '';
                    }}
                />

                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 hover:bg-white/10 gap-2"
                    onClick={() => document.getElementById('fbx-upload-header')?.click()}
                >
                    <Upload className="size-4" />
                    <span>Upload FBX</span>
                </Button>

                <select
                    className="bg-black/40 border border-white/20 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                >
                    {AVAILABLE_MODELS.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Main Content */}
            <div
                className="flex-1 relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFBXDrop}
            >
                <Canvas camera={{ position: [0, 1.5, 3], fov: 45 }}>
                    <color attach="background" args={["#111"]} />
                    <Grid infiniteGrid fadeDistance={10} sectionColor="#444" cellColor="#222" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[2, 2, 2]} intensity={1} castShadow />
                    <Environment preset="city" />

                    <OrbitControls target={[0, 1, 0]} />

                    <primitive object={vrm ? vrm.scene : new THREE.Group()} />
                </Canvas>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-blue-500 size-8" />
                            <span className="text-sm text-blue-200">Processing...</span>
                        </div>
                    </div>
                )}

                {/* Drag Drop Overlay */}
                {!fbxName && !isLoading && (
                    <div
                        className="absolute top-6 left-6 p-4 bg-black/60 rounded-xl border border-white/10 cursor-pointer hover:bg-black/80 transition-colors"
                        onClick={() => document.getElementById('fbx-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="fbx-upload"
                            accept=".fbx"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) processFBXFile(file);
                            }}
                        />
                        <div className="flex items-center gap-3 text-white/50">
                            <Upload className="size-5" />
                            <span className="text-sm">Drag & Drop or Click to Upload Mixamo FBX</span>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="rounded-full hover:bg-white/10"
                    >
                        {isPlaying ? <Pause className="fill-white" /> : <Play className="fill-white" />}
                    </Button>

                    <div className="px-3 text-xs font-mono text-blue-300">
                        {fbxName ? `Playing: ${fbxName}` : "No Animation Loaded"}
                    </div>
                </div>

                {/* Error Toast */}
                {error && (
                    <div className="absolute top-20 right-6 bg-red-900/80 text-white px-4 py-3 rounded-lg border border-red-500/50 shadow-lg animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="absolute top-1 right-1 p-1 hover:bg-white/20 rounded-full"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
