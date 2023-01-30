class Canvas {
    constructor() {
        this.rows = 10;
        this.columns = 10;
        this.worker = new Worker("canvas-worker.js");
        this.worker.onmessage = event => {
            this.canvas = event.data;
        };
    }

    create() {
        this.worker.postMessage({ rows: this.rows, columns: this.columns });
    }

    getCell(row, col) {
        return this.canvas[row][col];
    }

    setCell(row, col, value) {
        this.canvas[row][col] = value;
    }

    renderCanvas(element) {
        let html = "";
        for (let row = 0; row < this.rows; row++) {
            html += "<tr>";
            for (let col = 0; col < this.columns; col++) {
                html += "<td>" + this.getCell(row, col) + "</td>";
            }
            html += "</tr>";
        }
        element.innerHTML = "<table>" + html + "</table>";
    }
}

const canvas = new Canvas();
canvas.create();
canvas.setCell(0, 0, 1);
console.log(canvas.getCell(0, 0));
canvas.renderCanvas(document.getElementById("canvas"));
