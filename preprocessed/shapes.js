//shapes drawer

import {context} from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./whiteboard.js";


class drawShapes{

	strokeRectangle(e, prevMousePosX, prevMousePosY) {
		let tempX = e.clientX;
        let tempY = e.clientY;
		let strokeStack = [];

        context.fillStyle = 'rgba(255, 255, 255, 4.5)';
        context.fillRect(prevMousePosX, prevMousePosY, tempX - prevMousePosX, tempY - prevMousePosY);

        context.beginPath();
        context.moveTo(prevMousePosX, prevMousePosY);

        context.lineTo(tempX, prevMousePosY);
        context.lineTo(tempX, tempY);
        context.lineTo(prevMousePosX, tempY);
        context.lineTo(prevMousePosX, prevMousePosY);
        context.closePath();

        strokeStack = [
            { x: prevMousePosX, y: prevMousePosY },
            { x: tempX, y: prevMousePosY },
            { x: tempX, y: tempY },
            { x: prevMousePosX, y: tempY },
            { x: prevMousePosX, y: prevMousePosY }
        ];
        context.stroke();

        return strokeStack;
    }

	strokeDiamond(e, prevMousePosX, prevMousePosY){
		let tempX = e.clientX;
		let tempY = e.clientY;
		let strokeStack = [];

		context.fillStyle = 'rgba(255, 255, 255, 4.5)'; 
		context.fillRect(prevMousePosX , prevMousePosY, tempX - prevMousePosX, tempY - prevMousePosY);

		context.beginPath();
		context.moveTo(prevMousePosX + (( tempX - prevMousePosX )/2), prevMousePosY);

		context.lineTo(tempX, prevMousePosY + ((tempY - prevMousePosY)/2));
		context.lineTo(tempX - ((tempX - prevMousePosX)/2), tempY);
		context.lineTo(prevMousePosX,(prevMousePosY + tempY)/2);
		context.lineTo(prevMousePosX + (( tempX - prevMousePosX )/2), prevMousePosY);
		context.closePath();


		strokeStack = [
			{ x: prevMousePosX + (( tempX - prevMousePosX )/2), y: prevMousePosY },
			{ x: tempX, y: prevMousePosY + ((tempY - prevMousePosY)/2)},
			{ x: tempX - ((tempX - prevMousePosX)/2), y: tempY },
			{ x: prevMousePosX, y: (prevMousePosY + tempY)/2 },
			{x: prevMousePosX + (( tempX - prevMousePosX )/2), y: prevMousePosY }
		];
		context.stroke();

		return strokeStack;
	}

	drawRectangle = (e, prevMousePosX, prevMousePosY, fillColor) => {
		if(!fillColor.checked){
		return context.strokeRect(e.offsetX, e.offsetY, prevMousePosX - e.offsetX, prevMousePosY - e.offsetY);
		}
		context.fillRect(e.offsetX, e.offsetY, prevMousePosX - e.offsetX, prevMousePosY - e.offsetY);
	  };
	
	drawDiamond = (e, prevMousePosX, prevMousePosY, fillColor) => {
		const size = Math.min(Math.abs(prevMousePosX - e.offsetX), Math.abs(prevMousePosY - e.offsetY));
		const centerX = (prevMousePosX + e.offsetX) /2;
		const centerY = (prevMousePosY + e.offsetY) /2;
		// current transformation state
		context.save();
	
		// trandlating the canvas to the center of the rectangle
		context.translate(centerX, centerY);
	
		// rotating the canvas by 45 degrees
		context.rotate((45 * Math.PI) /180);
		if(fillColor.checked){
		context.fillRect(-size /2, -size /2, size, size);
		}
		// drawing the rectangle wit rotated coordinates
		context.strokeRect(-size /2, -size /2, size, size);
	
		// restoring the canvas
		context.restore();
	
		};
	
	drawCircle = (e, prevMousePosX, prevMousePosY, fillColor) => {
			context.beginPath();
			
			let radius = Math.sqrt(Math.pow((prevMousePosX - e.offsetX), 2) + Math.pow((prevMousePosY - e.offsetY),2));
			context.arc(prevMousePosX, prevMousePosY, radius, 0, 2 * Math.PI);
			
			fillColor.checked ? context.fill() : context.stroke();
			context.stroke();
			context.closePath();
			context.beginPath();
		};
}

export default drawShapes;