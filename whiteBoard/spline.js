// import { math } from "mathjs";

function magnitude(v){
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

function distance(p1, p2){
	const v = {x: p2.x - p1.x, y: p2.y - p1.y};
	return magnitude(v); 
}

function prunePoints(points){
	const resultPoints = [points[0]];
	let i = 0;
	// while (i<points.length){
	let current = 0;
	for(let i = 1; i< points.length; i++){
		const p0 = points[current];
		const p1 = points[i];
		

		if (distance(p0, p1) < 0.005){
			continue;
		}

		resultPoints.push(p1);
		current = i;
	}

	return resultPoints;
}

function determinant2(mat){
	return (mat[0] * mat[3] - mat[1] * mat[2]);
}

function determinant3(mat){
	const u0 = [
		mat[4], mat[5],
		mat[7], mat[8],
	];
	const u1 = [
		mat[3], mat[5],
		mat[6], mat[8],
	];
	const u2 = [
		mat[3], mat[4],
		mat[6], mat[7],
	];

	let res = 0;
	res += mat[0] * determinant2(u0);
	res -= mat[1] * determinant2(u1);
	res += mat[2] * determinant2(u2);
	return res;
}


function solveSystem2(coeffMat, constantMat){
	const d = determinant2(coeffMat);
	if (d == 0){
		console.log("moye moye");
		console.log(coeffMat);
		console.log(constantMat);
		return [0,0];
	}
	const m0 = [constantMat[0], coeffMat[1],
				constantMat[1],	coeffMat[3]];
	const m1 = [coeffMat[0], constantMat[0],
			  	coeffMat[2], constantMat[1]	];

	const d0 = determinant2(m0);
	const d1 = determinant2(m1);

	return [d0/d, d1/d];
}

function solveSystem3(coeffMat, constantMat){
	const d = determinant3(coeffMat);
	if (d == 0){
		console.log("moye moye");
		console.log(coeffMat);
		console.log(constantMat);
		return [0,0,0];
	}

	const m0 = [
		constantMat[0], coeffMat[1], coeffMat[2], 
		constantMat[1], coeffMat[4], coeffMat[5], 
		constantMat[2], coeffMat[7], coeffMat[8], 
	];
	
	const m1 = [
		coeffMat[0], constantMat[0], coeffMat[2],
		coeffMat[3], constantMat[1], coeffMat[5],
		coeffMat[6], constantMat[2], coeffMat[8],
	];

	const m2 = [
		coeffMat[0], coeffMat[1], constantMat[0],
		coeffMat[3], coeffMat[4], constantMat[1],
		coeffMat[6], coeffMat[7], constantMat[2],
	];

	const d0 = determinant3(m0);
	const d1 = determinant3(m1);
	const d2 = determinant3(m2);

	return [d0/d, d1/d, d2/d];
}

function lerp(a,b,t){
	return a + (b-a) * t;
}


function bezierTest(points, t){
	const a = {x: lerp(points[0].x, points[1].x, t), y: lerp(points[0].y, points[1].y, t)};
	const b = {x: lerp(points[1].x, points[2].x, t), y: lerp(points[1].y, points[2].y, t)};
	const c = {x: lerp(points[2].x, points[3].x, t), y: lerp(points[2].y, points[3].y, t)};

	const d = {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)};
	const e = {x: lerp(b.x, c.x, t), y: lerp(b.y, c.y, t)};

	const f = {x: lerp(d.x, e.x, t), y: lerp(d.y, e.y, t)};

	return f;
}



export function cubicBezierFitv2(points){
	const n = points.length;

	const distanceValues = [0];
	let totalT = 0;
	let sumT = 0, sumT2 = 0, sumT3 = 0, sumT4 = 0, sumT5 = 0, sumT6 = 0, 
	sumX = 0, sumXT = 0, sumXT2 = 0, sumXT3 = 0,
	sumY = 0, sumYT = 0, sumYT2 = 0, sumYT3 = 0;
	
	
	// calculate the approximate t values	
	for (let i = 0; i<n-1; i++){
		const vec = {
			x: points[i + 1].x - points[i].x,
			y: points[i + 1].y - points[i].y,
		};
		
		const distance = magnitude(vec);
		totalT += distance;
		distanceValues.push(totalT);
	}

	const tValues = distanceValues.map((d) => {
		return d/totalT;
	});

	for (let i=0; i<n; i++){
		const t = tValues[i];
		const t2 = t*t;
		const t3 = t2*t;
		const t4 = t3*t;
		const t5 = t4*t;
		const t6 = t5*t;

		sumT += t;
		sumT2 += t2;
		sumT3 += t3;
		sumT4 += t4;
		sumT5 += t5;
		sumT6 += t6;
	
		sumX += points[i].x;
		sumXT += points[i].x * t;
		sumXT2 += points[i].x * t2;
		sumXT3 += points[i].x * t3;
		
		sumY += points[i].y;
		sumYT += points[i].y * t;
		sumYT2 += points[i].y * t2;
		sumYT3 += points[i].y * t3;
	}

	const coeffMat = [
		sumT, 	sumT2, 	sumT3,
		sumT2, 	sumT3,	sumT4,
		sumT3, 	sumT4,	sumT5,
	];

	const constMatX = [
		sumX - points[0].x * n,
		sumXT - points[0].x * sumT,
		sumXT2 - points[0].x * sumT2,
	];

	const constMatY = [
		sumY - points[0].y * n,
		sumYT - points[0].y * sumT,
		sumYT2 - points[0].y * sumT2,
	];
	
	// [b,c,d] -> a is fixed as a = p0
	const solX = solveSystem3(coeffMat, constMatX);
	const solY = solveSystem3(coeffMat, constMatY);

	const finalConstMatX = [
		// solX[0] + 3*points[0].x, 
		solX[1] - 3*points[0].x, 
		solX[2] + points[0].x - points[n-1].x, 
	];
	const finalConstMatY = [
		// solY[0] + 3*points[0].y, 
		solY[1] - 3*points[0].y, 
		solY[2] + points[0].y - points[n-1].y, 
	];
	const finalCoeffMat = [
		// 3,0,
		-6,3,
		3,-3
	];

	const finalX = solveSystem2(finalCoeffMat, finalConstMatX);
	const finalY = solveSystem2(finalCoeffMat, finalConstMatY);

	const result = [
		points[0], {x: finalX[0], y: finalY[0]},
		{x: finalX[1], y: finalY[1]}, points[n-1] 
	];

	return result;
}




function cubicBezierFitv1(points){
	const n = points.length;
	
	
	// calculate the approximate t values	
	const distanceValues = [0];
	let totalT = 0;
	
	for (let i = 0; i<n-1; i++){
		const vec = {
			x: points[i + 1].x - points[i].x,
			y: points[i + 1].y - points[i].y,
		};
		
		const distance = magnitude(vec);
		totalT += distance;
		distanceValues.push(totalT);
	}
	// console.log("d")
	// console.log(distanceValues);


	const tValues = distanceValues.map((d) => {
		return d/totalT;
	});

	// console.log("t")
	// console.log(tValues);

	// const a = [2,2,3,-2];
	// const c = [4,1];

	// const sol = solveSystem2(a, c);
	// console.log("sol");
	// console.log(sol);
	
	
	
	let controlPoints = [{x:0, y:0}, {x:0, y:0}];
	
	const stride = 0;
	for (let i = 0; i<n-3-stride; i++){
		const p1 = points[i+1];
		// const p2 = points[i+2+stride];
		const p2 = points[n-1-i-1];
		
		const t1 = tValues[i+1];
		// const t2 = tValues[i+2+stride];
		const t2 = tValues[n-1-i-1];
		
		// console.log(`t: ${t1} ${t2}`);

		const coeffMat = [
			(3*t1 - 6*t1*t1 + 3*t1*t1*t1), (3*t1*t1 - 3*t1*t1*t1),
			(3*t2 - 6*t2*t2 + 3*t2*t2*t2), (3*t2*t2 - 3*t2*t2*t2),
		];
		const constantMatX = [
			p1.x - (1 - 3*t1 + 3*t1*t1 - t1*t1*t1) * points[0].x - t1*t1*t1 * points[n-1].x, 
			p2.x - (1 - 3*t2 + 3*t2*t2 - t2*t2*t2) * points[0].x - t2*t2*t2 * points[n-1].x, 
		];
		const constantMatY = [
			p1.y - (1 - 3*t1 + 3*t1*t1 - t1*t1*t1) * points[0].y - t1*t1*t1 * points[n-1].y, 
			p2.y - (1 - 3*t2 + 3*t2*t2 - t2*t2*t2) * points[0].y - t2*t2*t2 * points[n-1].y, 
		];


		const x = solveSystem2(coeffMat, constantMatX);
		const y = solveSystem2(coeffMat, constantMatY);


		const p = [p1, {x:x[0], y:y[0]}, {x:x[1], y:y[1]}, p2];

		// result.push({x: x[0], y: y[0]});
		// result.push({x: x[1], y: y[1]});
		// result.push(points[i+3]);

		controlPoints[0].x += x[0];
		controlPoints[0].y += y[0];
		controlPoints[1].x += x[1];
		controlPoints[1].y += y[1];

	}
	// console.log(controlPoints);
	controlPoints[0].x /= (n-3-stride);
	controlPoints[0].y /= (n-3-stride);
	controlPoints[1].x /= (n-3-stride);
	controlPoints[1].y /= (n-3-stride);

	const result = [
		points[0], 
		controlPoints[0], 
		controlPoints[1],
		points[n-1]
	];

	// for (let pt in points){
	// 	console.log(points[pt]);
	// 	const a = bezierTest(result, tValues[pt]);
	// 	console.log(a);
	// 	const v = {x: a.x - points[pt].x, y: a.y - points[pt].y};
	// 	console.log("error: ", magnitude(v));

	// }

	console.log(result);
	return result;
}



export function cubicBezierSplineFit(rawPoints){
	// console.log(rawPoints);
	const points = prunePoints(rawPoints);

	return cubicBezierFitv2(points);
	
	
}