onmessage = function(event) {
    const rows = event.data.rows;
    const columns = event.data.columns;
    const canvas = [];

    for (let row = 0; row < rows; row++) {
        const canvasRow = [];
        for (let col = 0; col < columns; col++) {
            canvasRow.push(0);
        }
        canvas.push(canvasRow);
    }

    postMessage(canvas);
};