
const CONFIGURATOR_LINE_WIDTH = 40
const MIN_SCREEN_WIDTH = CONFIGURATOR_LINE_WIDTH * 10
const MIN_SCREEN_HEIGHT = CONFIGURATOR_LINE_WIDTH * 5

let displayWidth, displayHeight, numScreens, wallpaperEnabled
let selection = {
    "screen": -1,
    "x": -1,
    "y": -1,
    "resize": "",
}

let screens = [
    {"id": 0, "x": 880, "y": 0, "w": 2560, "h": 1440, "color": "#ff00ff", "wallpaper": document.createElement("canvas")},
    {"id": 1, "x": 1520, "y": 360, "w": 1920, "h": 1080, "color": "#ffff00", "wallpaper": document.createElement("canvas")},
    {"id": 2, "x": 0, "y": 0, "w": 1920, "h": 1080, "color": "#00ffff", "wallpaper": document.createElement("canvas")},
    {"id": 3, "x": 0, "y": 0, "w": 1280, "h": 720, "color": "#00ff00", "wallpaper": document.createElement("canvas")},
    {"id": 4, "x": 0, "y": 0, "w": 1280, "h": 720, "color": "#0000ff", "wallpaper": document.createElement("canvas")},
    {"id": 5, "x": 0, "y": 0, "w": 1280, "h": 720, "color": "#ff0000", "wallpaper": document.createElement("canvas")},
]

function readSettings() {
    displayWidth = Math.floor(document.getElementById("display_width").value)
    displayHeight = Math.floor(document.getElementById("display_height").value)
    numScreens = Math.floor(document.getElementById("num_screens").value)
}

function clampValues() {
    for (let i = 0; i < numScreens; i++) {
        const s = screens[i]
        s.w = Math.min(s.w, displayWidth)
        s.h = Math.min(s.h, displayHeight)
        if (s.x + s.w > displayWidth) {
            s.x = displayWidth - s.w;
        }
        if (s.y + s.h > displayHeight) {
            s.y = displayHeight - s.h;
        }
        s.x = Math.floor(Math.max(s.x, 0))
        s.y = Math.floor(Math.max(s.y, 0))
        s.w = Math.floor(Math.max(s.w, MIN_SCREEN_WIDTH))
        s.h = Math.floor(Math.max(s.h, MIN_SCREEN_HEIGHT))
    }
}

function renderVirtualScreenSettings() {
    const ul = document.getElementById("virtual_screen_settings")
    ul.innerHTML = "";
    for (let i = 0; i < numScreens; i++) {
        const s = screens[i]
        const row = document.createElement("li")
        const w_input = document.createElement("input")
        w_input.className = "form-control resolution"
        w_input.step = 10
        w_input.min = MIN_SCREEN_WIDTH
        w_input.max = displayWidth
        w_input.value = s.w
        w_input.type = "number"
        w_input.oninput = ev => {s.w = ev.target.value; refresh(settings=false)}
        const h_input = document.createElement("input")
        h_input.className = "form-control resolution"
        h_input.step = 10
        h_input.min = MIN_SCREEN_HEIGHT
        h_input.max = displayHeight
        h_input.value = s.h
        h_input.type = "number"
        h_input.oninput = ev => {s.h = ev.target.value; refresh(settings=false)}
        row.append(w_input, "x", h_input)
        ul.appendChild(row);
    }
}

function renderConfiguratorCanvas() {
    const canvas = document.getElementById("configurator_canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = displayWidth
    canvas.height = displayHeight
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    for (let i = 0; i < numScreens; i++) {
        const s = screens[i]
        if (selection.screen === i) {
            ctx.fillStyle = s.color + "55";
            ctx.fillRect(s.x, s.y, s.w, s.h);
        }
        ctx.strokeStyle = s.color;
        const lw = CONFIGURATOR_LINE_WIDTH
        ctx.lineWidth = lw;
        ctx.strokeRect(s.x + lw / 2, s.y + lw / 2, s.w - lw, s.h - lw);
        let diagonal_1 = new Path2D();
        diagonal_1.moveTo(s.x + lw / 2, s.y + lw / 2)
        diagonal_1.lineTo(s.x + s.w - lw / 2, s.y + s.h - lw / 2)

        let diagonal_2 = new Path2D();
        diagonal_2.lineTo(s.x + lw / 2, s.y + s.h - lw / 2)
        diagonal_2.lineTo(s.x + s.w - lw / 2, s.y + lw / 2)

        ctx.lineWidth = Math.floor(lw / 2);
        ctx.stroke(diagonal_1)
        ctx.stroke(diagonal_2)
    }
    if (selection.resize) {
        const s = screens[selection.screen]
        ctx.fillStyle = "#000000";
        const fontSize = 200
        const padding = 50
        ctx.font = fontSize + "px Arial";
        ctx.fillText(s.w + "x" + s.h, s.x + padding, s.y + fontSize + padding);
    }
}

function drawWallpaperFragment(ctx, s) {
    const [w, h] = getDrawableBackgroundSize();
    const width_ratio = w / ctx.canvas.width;
    const height_ratio = h / ctx.canvas.height;
    const sx = s.x * width_ratio;
    const sy = s.y * height_ratio;
    const sw = s.w * width_ratio;
    const sh = s.h * height_ratio;
    ctx.drawImage(s.wallpaper, sx, sy, sw, sh, s.x, s.y, s.w, s.h);
}

function renderWallpaper() {
    const canvas = document.getElementById("wallpaper");
    const ctx = canvas.getContext("2d");
    canvas.width = displayWidth
    canvas.height = displayHeight
    if (wallpaperEnabled) {
        drawBackground(ctx)
    } else {
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(0, 0, displayWidth, displayHeight);
    }
    for (let i = 0; i < numScreens; i++) {
        const s = screens[i]
        if (wallpaperEnabled) {
            drawWallpaperFragment(ctx, s);
        } else {
            ctx.fillStyle = s.color + "ee";
            ctx.fillRect(s.x, s.y, s.w, s.h);
        }
    }
}

function renderCodeblocks() {
    const code_setmonitor = document
        .getElementById("codeblock_setmonitor")
        .getElementsByTagName("code")[0];
    const code_delmonitor = document
        .getElementById("codeblock_delmonitor")
        .getElementsByTagName("code")[0]
    let text_setmonitor = "function add_vscreens {\n"
    let text_delmonitor = "function del_vscreens {\n"
    for (let i = 0; i < numScreens; i++) {
        const s = screens[i]
        const monitor_name = i + "_" + s.w + "_" + s.h
        text_setmonitor += "    xrandr --setmonitor ";             // command
        text_setmonitor += monitor_name + " ";                 // monitor name
        text_setmonitor += s.w + "/" + s.w + "x" + s.h + "/";  // resolution
        text_setmonitor += "0+" + s.x + "+" + s.y + " ";       // offset
        text_setmonitor += "none\n"                            // output

        text_delmonitor += "    xrandr --delmonitor " + monitor_name + "\n"
    }
    text_setmonitor += "}"
    text_delmonitor += "}"
    code_setmonitor.textContent = text_setmonitor
    code_delmonitor.textContent = text_delmonitor

}

function refresh(settings=true) {
    readSettings()
    if (displayWidth < 1000 || displayHeight < 500)
        return
    clampValues()
    if (settings)
        renderVirtualScreenSettings()
    renderConfiguratorCanvas()
    renderCodeblocks()
    renderWallpaper()
}

function within(p, s) {
    if (p.x < s.x)
        return false
    if (p.y < s.y)
        return false
    if (p.x > s.x + s.w)
        return false
    if (p.y > s.y + s.h)
        return false
    return true
}

function resetSelection() {
    selection.screen = -1
    selection.resize = ""
    refresh()
}

function getDrawableBackgroundSize() {
    let w, h
    let screen_ratio = displayWidth / displayHeight
    let image_ratio = wallpaper.width / wallpaper.height
    if (image_ratio > screen_ratio) {
        h = wallpaper.height
        w = h * screen_ratio
    } else {
        w = wallpaper.width
        h = w / screen_ratio
    }
    return [w, h]
}

function drawBackground(ctx) {
    const [w, h] = getDrawableBackgroundSize();
    ctx.drawImage(wallpaper, 0, 0, w, h, 0, 0, displayWidth, displayHeight);
}

function getCanvasPosition(ev) {
    const scale_x = displayWidth / configurator_canvas.clientWidth
    const scale_y = displayHeight / configurator_canvas.clientHeight
    return {"x": ev.offsetX * scale_x, "y": ev.offsetY * scale_y};
}

function getHoveredScreen(p) {
    const lw = CONFIGURATOR_LINE_WIDTH
    const props = {"resize": ""}
    for (let i=numScreens-1; i>=0; i--) {
        const s = screens[i]
        if (within(p, s)) {
            const edge = {
                "top": within(p, {"x": s.x, "y": s.y, "w": s.w, "h": lw}),
                "right": within(p, {"x": s.x + s.w - lw, "y": s.y, "w": lw, "h": s.h}),
                "bottom": within(p, {"x": s.x, "y": s.y + s.h - lw, "w": s.w, "h": lw}),
                "left": within(p, {"x": s.x, "y": s.y, "w": lw, "h": s.h}),
            };
            if (edge.top)
                props.resize = "n"
            if (edge.right)
                props.resize = "e"
            if (edge.bottom)
                props.resize = "s"
            if (edge.left)
                props.resize = "w"
            if (edge.top && edge.right)
                props.resize = "ne"
            if (edge.top && edge.left)
                props.resize = "nw"
            if (edge.bottom && edge.right)
                props.resize = "se"
            if (edge.bottom && edge.left)
                props.resize = "sw"
            return [s, props]
        }
    }
    return [null, props]
}

function hexToRgb(hex) {
    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: Math.floor(result[1], 16) / 255,
        g: Math.floor(result[2], 16) / 255,
        b: Math.floor(result[3], 16) / 255,
    } : null;
}

function applyColorFilter(color) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    canvas.width = wallpaper.width
    canvas.height = wallpaper.height
    ctx.drawImage(wallpaper, 0, 0)
    const imageData = ctx.getImageData(0, 0, wallpaper.width, wallpaper.height);
    const pixels = imageData.data;
    const rgb_color = hexToRgb(color)
    for (let i=0; i < pixels.length; i += 4) {
        // const lightness = Math.floor((pixels[i] + pixels[i+1] + pixels[i+2]) / 3)
        pixels[i] *= rgb_color.r
        pixels[i+1] *= rgb_color.g;
        pixels[i+2] *= rgb_color.b;
    }
    ctx.putImageData(imageData, 0, 0)
    return canvas
}

const wallpaper = new Image()
wallpaper.onload = ev => {
    for (const s of screens) {
        s.wallpaper = applyColorFilter(s.color)
    }
    document.getElementById("wallpaper_url").className = "form-control"
    wallpaperEnabled = true;
    refresh();
}
wallpaper.onerror = err => {
    document.getElementById("wallpaper_url").className = "form-control is-invalid"
    wallpaperEnabled = false
    refresh()
}
wallpaper.crossOrigin = "Anonymous"
wallpaper.src = document.getElementById("wallpaper_url").value

document.getElementById("display_width").oninput = refresh
document.getElementById("display_height").oninput = refresh
document.getElementById("num_screens").oninput = refresh
document.getElementById("wallpaper_url").oninput = ev => {
    wallpaper.src = ev.target.value
}

let configurator_canvas = document.getElementById("configurator_canvas");
configurator_canvas.onmousedown = ev => {
    if (ev.button !== 0)
        return
    const p = getCanvasPosition(ev)
    resetSelection()
    const [s, props] = getHoveredScreen(p)
    if (!s)
        return
    selection.screen = s.id
    selection.p = p
    selection.old_screen = {"x": s.x, "y": s.y, "w": s.w, "h": s.h}
    selection.resize = props.resize
    refresh()
}

configurator_canvas.onmouseup = resetSelection
configurator_canvas.onmouseleave = resetSelection
configurator_canvas.onmousemove = ev => {
    const p = getCanvasPosition(ev)
    if (selection.screen < 0) {
        configurator_canvas.style.cursor = "default"
        const [screen, props] = getHoveredScreen(p)
        if (screen) {
            if (props.resize)
                configurator_canvas.style.cursor = props.resize + "-resize"
            else
                configurator_canvas.style.cursor = "move"
        }
        return
    }
    const s = screens[selection.screen]
    const diff = {"x": selection.p.x - p.x, "y": selection.p.y - p.y}
    if (!selection.resize) {
        s.x = selection.old_screen.x - diff.x
        s.y = selection.old_screen.y - diff.y
    }
    if (selection.resize.includes("n")) {
        s.h = selection.old_screen.h + diff.y
        if (s.h >= MIN_SCREEN_HEIGHT)
            s.y = selection.old_screen.y - diff.y
    }
    if (selection.resize.includes("s")) {
        s.h = selection.old_screen.h - diff.y
    }
    if (selection.resize.includes("e")) {
        s.w = selection.old_screen.w - diff.x
    }
    if (selection.resize.includes("w")) {
        s.w = selection.old_screen.w + diff.x
        if (s.w >= MIN_SCREEN_WIDTH)
            s.x = selection.old_screen.x - diff.x
    }

    refresh();
}

refresh()
