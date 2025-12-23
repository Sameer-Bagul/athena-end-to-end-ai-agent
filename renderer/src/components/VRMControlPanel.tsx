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

                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Play className="size-5 text-primary" />
                                Animation Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                <Button size="icon" variant="outline" disabled={!animationFile}>
                                    <SkipBack className="size-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="default"
                                    disabled={!animationFile}
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                                </Button>
                                <Button size="icon" variant="outline" disabled={!animationFile}>
                                    <SkipForward className="size-4" />
                                </Button>
                                <Button size="icon" variant="outline" disabled={!animationFile}>
                                    <RotateCcw className="size-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Speed</Label>
                                    <span className="text-sm text-muted-foreground">{animationSpeed[0]}x</span>
                                </div>
                                <Slider
                                    value={animationSpeed}
                                    onValueChange={setAnimationSpeed}
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    disabled={!animationFile}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <ScrollArea className="h-[400px]">
                        <Tabs defaultValue="lighting" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="lighting">
                                    <Sun className="mr-1 size-3" />
                                    Light
                                </TabsTrigger>
                                <TabsTrigger value="camera">
                                    <Camera className="mr-1 size-3" />
                                    Camera
                                </TabsTrigger>
                                <TabsTrigger value="scene">
                                    <Sliders className="mr-1 size-3" />
                                    Scene
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="lighting" className="mt-4 space-y-4">
                                <Card className="border-border/50 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Lighting Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Intensity</Label>
                                                <span className="text-sm text-muted-foreground">{lightIntensity[0].toFixed(1)}</span>
                                            </div>
                                            <Slider value={lightIntensity} onValueChange={setLightIntensity} min={0} max={3} step={0.1} />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="shadows" className="flex items-center gap-2">
                                                <Moon className="size-4" />
                                                Shadows
                                            </Label>
                                            <Switch id="shadows" checked={shadowsEnabled} onCheckedChange={setShadowsEnabled} />
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label>Ambient Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" defaultValue="#3b82f6" className="h-10 w-20" />
                                                <Input type="text" defaultValue="#3b82f6" className="flex-1" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Directional Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" defaultValue="#ffffff" className="h-10 w-20" />
                                                <Input type="text" defaultValue="#ffffff" className="flex-1" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="camera" className="mt-4 space-y-4">
                                <Card className="border-border/50 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Camera Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Field of View</Label>
                                                <span className="text-sm text-muted-foreground">{cameraFov[0]}°</span>
                                            </div>
                                            <Slider value={cameraFov} onValueChange={setCameraFov} min={20} max={120} step={1} />
                                        </div>

                                        <Separator />

                                        <div className="grid grid-cols-3 gap-2">
                                            <Button variant="outline" size="sm">
                                                Front
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                Side
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                Top
                                            </Button>
                                        </div>

                                        <Button variant="outline" className="w-full bg-transparent" onClick={handleResetCamera}>
                                            <RotateCcw className="mr-2 size-4" />
                                            Reset Camera
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="scene" className="mt-4 space-y-4">
                                <Card className="border-border/50 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">Scene Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="grid" className="flex items-center gap-2">
                                                <Grid3x3 className="size-4" />
                                                Show Grid
                                            </Label>
                                            <Switch id="grid" checked={gridVisible} onCheckedChange={setGridVisible} />
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Palette className="size-4" />
                                                Background Color
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="color"
                                                    value={backgroundColor}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    className="h-10 w-20"
                                                />
                                                <Input
                                                    type="text"
                                                    value={backgroundColor}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Background Type</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" size="sm">
                                                    Solid
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Gradient
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>
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
