import * as React from "react"
import {
    CheckCircle2,
    MessageSquare,
    Mic,
    Upload,
    User,
    Users,
    FileVideo,
    Box,
    ChevronUp,
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Separator } from "./ui/separator"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { ScrollArea, ScrollBar } from "./ui/scroll-area"
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "./ui/tabs"
import { Slider } from "./ui/slider"
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "./ui/drawer"
import ThreeStage from "./ThreeStage"
import { AVAILABLE_MODELS } from "../lib/models"
import { AVAILABLE_ANIMATIONS } from "../lib/animations"
import { cn } from "../lib/utils"

export function VRMControlPanel() {
    const [vrmFile, setVrmFile] = React.useState<File | null>(null)
    const [vrmUrl, setVrmUrl] = React.useState<string>("/models/athena.vrm")
    const [animationFile, setAnimationFile] = React.useState<File | null>(null)
    const [animationUrl, setAnimationUrl] = React.useState<string>("/animations/Jump.vrma")
    const [isPlaying] = React.useState(false)
    const [animationSpeed, setAnimationSpeed] = React.useState([0.4])
    const [lightIntensity] = React.useState([1])
    const [cameraFov] = React.useState([50])
    const [gridVisible] = React.useState(true)
    const [shadowsEnabled] = React.useState(true)
    const [backgroundColor] = React.useState("#0f0f1e")
    const [inputText, setInputText] = React.useState("")
    const [speechText, setSpeechText] = React.useState("")
    const [cameraMode, setCameraMode] = React.useState("full")

    const handleSpeak = () => {
        if (inputText.trim()) {
            setSpeechText(inputText)
        }
    }

    const handleModelSelect = (filename: string) => {
        setVrmFile(null)
        setVrmUrl(`/models/${filename}`)
    }

    const handleAnimationSelect = (filename: string) => {
        setAnimationFile(null)
        setAnimationUrl(`/animations/${filename}`)
    }

    const handleVRMUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (vrmUrl && vrmUrl.startsWith("blob:")) URL.revokeObjectURL(vrmUrl)
            setVrmFile(file)
            const url = URL.createObjectURL(file)
            setVrmUrl(url)
            console.log("[v0] VRM file selected:", file.name, "URL:", url)
        }
    }

    const handleAnimationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (animationUrl) URL.revokeObjectURL(animationUrl)
            setAnimationFile(file)
            const url = URL.createObjectURL(file)
            setAnimationUrl(url)
            console.log("[v0] Animation file selected:", file.name, "URL:", url)
        }
    }

    React.useEffect(() => {
        return () => {
            if (vrmUrl && vrmUrl.startsWith("blob:")) URL.revokeObjectURL(vrmUrl)
            if (animationUrl) URL.revokeObjectURL(animationUrl)
        }
    }, [vrmUrl, animationUrl])

    return (
        <div className="h-screen w-full relative overflow-hidden bg-background">
            {/* Main Stage */}
            <main className="h-full w-full">
                {vrmUrl ? (
                    <ThreeStage
                        vrmUrl={vrmUrl}
                        animationUrl={animationUrl}
                        isPlaying={isPlaying}
                        animationSpeed={animationSpeed[0]}
                        lightIntensity={lightIntensity[0]}
                        cameraFov={cameraFov[0]}
                        shadowsEnabled={shadowsEnabled}
                        gridVisible={gridVisible}
                        backgroundColor={backgroundColor}
                        speechText={speechText}
                        cameraMode={cameraMode}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-muted/20">
                        <div className="text-center">
                            <Box className="mx-auto mb-4 size-16 text-muted-foreground" />
                            <p className="text-lg font-medium text-muted-foreground">3D Viewer Preview</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Drawer Trigger */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <Drawer>
                    <DrawerTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-lg h-12 px-6">
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Open Controls
                        </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                        <div className="mx-auto w-full max-w-5xl">
                            <DrawerHeader>
                                <DrawerTitle>Control Panel</DrawerTitle>
                                <DrawerDescription>Manage your VRM model, animations, and speech.</DrawerDescription>
                            </DrawerHeader>

                            <div className="p-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
                                {/* Model Library */}
                                <div className="col-span-1 md:col-span-2 space-y-4">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <Users className="size-4" /> Model Library
                                    </h3>
                                    <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border/50 bg-card/50">
                                        <div className="flex w-max space-x-4 p-4">
                                            {AVAILABLE_MODELS.map((model) => (
                                                <button
                                                    key={model}
                                                    onClick={() => handleModelSelect(model)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground transition-all w-[100px]",
                                                        vrmUrl.endsWith(model) ? "border-primary bg-accent/50 ring-1 ring-primary" : "border-border/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "size-10 rounded-full flex items-center justify-center bg-muted",
                                                        vrmUrl.endsWith(model) ? "bg-primary/20" : ""
                                                    )}>
                                                        <User className="size-5 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-xs font-medium truncate w-full text-center" title={model}>
                                                        {model.replace(".vrm", "")}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                </div>

                                {/* Animation Library */}
                                <div className="col-span-1 md:col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium flex items-center gap-2">
                                            <FileVideo className="size-4" /> Animation Library
                                        </h3>
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <Label className="text-xs whitespace-nowrap">Speed: {animationSpeed[0]}x</Label>
                                            <Slider
                                                value={animationSpeed}
                                                onValueChange={setAnimationSpeed}
                                                max={3}
                                                min={0.1}
                                                step={0.1}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border/50 bg-card/50">
                                        <div className="flex w-max space-x-4 p-4">
                                            {AVAILABLE_ANIMATIONS.map((anim) => (
                                                <button
                                                    key={anim}
                                                    onClick={() => handleAnimationSelect(anim)}
                                                    className={cn(
                                                        "flex flex-col items-center gap-2 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground transition-all w-[100px]",
                                                        animationUrl.endsWith(anim) ? "border-primary bg-accent/50 ring-1 ring-primary" : "border-border/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "size-10 rounded-full flex items-center justify-center bg-muted",
                                                        animationUrl.endsWith(anim) ? "bg-primary/20" : ""
                                                    )}>
                                                        <FileVideo className="size-5 text-muted-foreground" />
                                                    </div>
                                                    <span className="text-xs font-medium truncate w-full text-center" title={anim}>
                                                        {anim.replace(".vrma", "").replace(".fbx", "")}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                </div>

                                {/* File Management */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <Upload className="size-4" /> File Management
                                    </h3>
                                    <Card className="border-border/50 bg-card/50">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="vrm-upload" className="flex items-center gap-2">
                                                    <User className="size-4" />
                                                    VRM Model
                                                </Label>
                                                <div className="flex flex-col gap-2">
                                                    <Input id="vrm-upload" type="file" accept=".vrm" onChange={handleVRMUpload} />
                                                    {vrmFile ? (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="size-4 text-primary" />
                                                            <Badge variant="secondary" className="flex-1 truncate">
                                                                {vrmFile.name}
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="flex-1 truncate text-muted-foreground">
                                                                Default: athena.vrm
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label htmlFor="animation-upload" className="flex items-center gap-2">
                                                    <FileVideo className="size-4" />
                                                    Animation File
                                                </Label>
                                                <div className="flex flex-col gap-2">
                                                    <Input
                                                        id="animation-upload"
                                                        type="file"
                                                        accept=".vrma,.fbx,.bvh,.glb"
                                                        onChange={handleAnimationUpload}
                                                    />
                                                    {animationFile && (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="size-4 text-primary" />
                                                            <Badge variant="secondary" className="flex-1 truncate">
                                                                {animationFile.name}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Speech Control */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <MessageSquare className="size-4" /> Speech Control
                                    </h3>
                                    <Card className="border-border/50 bg-card/50">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Camera Mode</Label>
                                                <Tabs defaultValue="full" value={cameraMode} onValueChange={setCameraMode} className="w-full">
                                                    <TabsList className="grid w-full grid-cols-3">
                                                        <TabsTrigger value="face">Face</TabsTrigger>
                                                        <TabsTrigger value="half">Half</TabsTrigger>
                                                        <TabsTrigger value="full">Full</TabsTrigger>
                                                    </TabsList>
                                                </Tabs>
                                            </div>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label htmlFor="speech-input">Text to Speak</Label>
                                                <Textarea
                                                    id="speech-input"
                                                    placeholder="Type what you want the model to say..."
                                                    value={inputText}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                                                    className="min-h-[100px] resize-none"
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleSpeak}
                                                disabled={!inputText.trim()}
                                            >
                                                <Mic className="mr-2 size-4" />
                                                Speak
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    )
}
