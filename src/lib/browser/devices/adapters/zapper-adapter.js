import { VIDEO_WIDTH, VIDEO_HEIGHT } from "../../../core/common/constants";

//=========================================================
// Adapter for zapper device
//=========================================================

export class ZapperAdapter {

    constructor(zapper) {
        this.zapper = zapper;
    }

    init(videoManager) {
        this.videoManager = videoManager;
    }

    getDevice() {
        return this.zapper;
    }

    inputChanged(input, down) {
        if (input === "trigger") {
            this.zapper.setTriggerPressed(down);
        }
    }

    stateChanged(state) {
        var rect = this.videoManager.getOutputRect();
        var horizontalScale = (rect.right - rect.left) / VIDEO_WIDTH;
        var verticalScale = (rect.bottom - rect.top) / VIDEO_HEIGHT;
        var x = ~~(((state.cursorX || 0) - rect.left) / horizontalScale);
        var y = ~~(((state.cursorY || 0) - rect.top) / verticalScale);
        this.zapper.setBeamPosition(x, y);
    }

}

ZapperAdapter["dependencies"] = [ "videoManager" ];