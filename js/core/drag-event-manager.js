// 统一拖拽事件管理器
// 管理 document 级的 mousemove/mouseup 使用，消除多系统重复注册和监听器泄漏

class DragEventManager {
    constructor() {
        this._activeDrag = null;
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    /**
     * 开始拖拽会话
     * @param {string} id - 唯一标识
     * @param {Object} handlers
     * @param {Function} [handlers.onDrag] - mousemove 回调
     * @param {Function} [handlers.onDragEnd] - mouseup 回调
     */
    startDrag(id, handlers = {}) {
        if (this._activeDrag) {
            this._activeDrag = null;
        }
        this._activeDrag = { id, ...handlers };
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    /**
     * 主动结束拖拽会话
     */
    endDrag(id) {
        if (this._activeDrag && this._activeDrag.id === id) {
            this._activeDrag = null;
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('mouseup', this._onMouseUp);
        }
    }

    /**
     * 将视口坐标转为 canvas 相对坐标
     */
    clientToCanvas(clientX, clientY, boardCanvasId = 'board-canvas') {
        const boardCanvas = document.getElementById(boardCanvasId);
        if (!boardCanvas) return { x: clientX, y: clientY };
        const rect = boardCanvas.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    _onMouseMove(e) {
        if (this._activeDrag && this._activeDrag.onDrag) {
            this._activeDrag.onDrag(e);
        }
    }

    _onMouseUp(e) {
        const drag = this._activeDrag;
        if (drag) {
            this._activeDrag = null;
            document.removeEventListener('mousemove', this._onMouseMove);
            document.removeEventListener('mouseup', this._onMouseUp);
            if (drag.onDragEnd) {
                drag.onDragEnd(e);
            }
        }
    }
}

export const dragEventManager = new DragEventManager();
