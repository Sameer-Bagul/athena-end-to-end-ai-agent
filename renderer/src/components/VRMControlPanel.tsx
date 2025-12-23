import * as React from "react"
import {
    Upload,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    RotateCcw,
    Sun,
    Moon,
    Camera,
    Box,
    Sliders,
    FileVideo,
    User,
    Palette,
    Grid3x3,
    CheckCircle2,
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Slider } from "./ui/slider"
import { Switch } from "./ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import { Badge } from "./ui/badge"
import ThreeStage from "./ThreeStage" // Replaced VRMViewer with ThreeStage

export function VRMControlPanel() {
    const [vrmFile, setVrmFile] = React.useState<File | null>(null)
    const [vrmUrl, setVrmUrl] = React.useState<string>("") // Default empty to show upload prompt
    const [animationFile, setAnimationFile] = React.useState<File | null>(null)
    const [animationUrl, setAnimationUrl] = React.useState<string>("")
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [animationSpeed, setAnimationSpeed] = React.useState([1])
    const [lightIntensity, setLightIntensity] = React.useState([1])
    const [cameraFov, setCameraFov] = React.useState([50])
    const [gridVisible, setGridVisible] = React.useState(true)
    const [shadowsEnabled, setShadowsEnabled] = React.useState(true)
    const [backgroundColor, setBackgroundColor] = React.useState("#0f0f1e")

    const handleVRMUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (vrmUrl) URL.revokeObjectURL(vrmUrl)
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
            if (vrmUrl) URL.revokeObjectURL(vrmUrl)
            if (animationUrl) URL.revokeObjectURL(animationUrl)
        }
    }, [vrmUrl, animationUrl])

    const handleResetCamera = () => {
        setCameraFov([50])
    }

    return (
        <div className="space-y-6 p-6 h-screen overflow-hidden flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">VRM Viewer Studio</h1>
                    <p className="text-muted-foreground">Professional 3D character model viewer and animator</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                    <Box className="mr-1 size-3" />
                    v1.0.0
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-[350px_1fr] flex-1 min-h-0">
                <aside className="space-y-6 overflow-y-auto pr-2">
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="size-5 text-primary" />
                                File Management
                            </CardTitle>
                            <CardDescription>Upload your VRM model and animation files</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="vrm-upload" className="flex items-center gap-2">
                                    <User className="size-4" />
                                    VRM Model
                                </Label>
                                <div className="flex flex-col gap-2">
                                    <Input id="vrm-upload" type="file" accept=".vrm" onChange={handleVRMUpload} />
                                    {vrmFile && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="size-4 text-primary" />
                                            <Badge variant="secondary" className="flex-1">
                                                {vrmFile.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {(vrmFile.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
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
                                            <Badge variant="secondary" className="flex-1">
                                                {animationFile.name}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {(animationFile.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </aside>

                <main className="flex-1 min-h-0">
                    <Card className="h-full border-border/50 bg-card/50 backdrop-blur overflow-hidden">
                        <CardContent className="h-full p-0 relative">
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
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <div className="text-center">
                                        <Box className="mx-auto mb-4 size-16 text-muted-foreground" />
                                        <p className="text-lg font-medium text-muted-foreground">3D Viewer Preview</p>
                                        <p className="text-sm text-muted-foreground/70">Upload a VRM model to begin</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
