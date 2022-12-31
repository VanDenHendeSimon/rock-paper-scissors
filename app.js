'use strict';

const objectSizePx = 32;
const objectCount = 80;
const speedRange = 8;

let clientWidth = 0;
let clientHeight = 0;

let intervalId;

const types = ['rock', 'paper', 'scissors']

const getRandomVelocity = () => (Math.random() * speedRange) - (speedRange * 0.5);

const invertXVelocity = (object) => {
    object.setAttribute('data-vel-x', +object.getAttribute('data-vel-x') * -1);
}

const invertYVelocity = (object) => {
    object.setAttribute('data-vel-y', +object.getAttribute('data-vel-y') * -1);
}

const spawnObject = () => {
    const xRange = clientWidth - (2 * objectSizePx);
    const yRange = clientHeight - (2 * objectSizePx);

    const xPos = Math.floor((Math.random() * xRange) + objectSizePx);
    const yPos = Math.floor((Math.random() * yRange) + objectSizePx);

    const typeIdx = Math.floor(Math.random() * types.length);

    const object = document.createElement("div");
    object.setAttribute('data-object', typeIdx);
    object.setAttribute('data-object-name', types[typeIdx]);
    object.style.position = 'absolute';
    object.style.left = `${xPos}px`;
    object.style.top = `${yPos}px`;
    object.style.width = `${objectSizePx}px`;
    object.style.height = `${objectSizePx}px`;

    object.setAttribute('data-vel-x', getRandomVelocity());
    object.setAttribute('data-vel-y', getRandomVelocity());

    document.body.appendChild(object);
    return object;
}

const setVelocityBasedOnPositionRelativeToPlayground = (bbox, object) => {
    if (bbox.left <= 0) invertXVelocity(object);
    if (bbox.top <= 0) invertYVelocity(object);
    if (bbox.right >= clientWidth) invertXVelocity(object);
    if (bbox.bottom >= clientHeight) invertYVelocity(object);
}

const moveObject = (bbox, object) => {
    object.style.left = `${bbox.left + +object.getAttribute('data-vel-x')}px`;
    object.style.top = `${bbox.top + +object.getAttribute('data-vel-y')}px`;
}

const objectIntersectsOtherObject = (bboxOne, bboxTwo) => {
    return (
        bboxOne.right >= bboxTwo.left &&
        bboxOne.left <= bboxTwo.right &&
        bboxOne.top <= bboxTwo.bottom &&
        bboxOne.bottom >= bboxTwo.top
    );
}

const resolveWinner = (objects) => {
    const objectNames = objects.map(o => o.getAttribute('data-object-name'));

    if (objectNames[0] === objectNames[1]) return undefined;
    if (objectNames[0] === 'rock' && objectNames[1] === 'scissors') return 0;
    if (objectNames[0] === 'scissors' && objectNames[1] === 'paper') return 0;
    if (objectNames[0] === 'paper' && objectNames[1] === 'rock') return 0;
    return 1;
}

const jitterVelocity = (num) => {
    return num + (getRandomVelocity() * 0.25);
}

const copyFromAToB = (objectA, objectB) => {
    objectB.setAttribute('data-object', objectA.getAttribute('data-object'));
    objectB.setAttribute('data-object-name', objectA.getAttribute('data-object-name'));

    objectB.setAttribute('data-vel-x', jitterVelocity(+objectA.getAttribute('data-vel-x')));
    objectB.setAttribute('data-vel-y', jitterVelocity(+objectA.getAttribute('data-vel-y')));
}

const handleCollision = (objectOne, objectTwo) => {
    const winnerIndex = resolveWinner([objectOne, objectTwo]);
    if (!winnerIndex) return;

    if (winnerIndex === 0) {
        copyFromAToB(objectOne, objectTwo);
        return;
    }

    copyFromAToB(objectTwo, objectOne);
}

const handleGameOver = (winnerIdx) => {
    if (winnerIdx < 0) return;

    const winnerElement = document.getElementById('winner-slogan');
    winnerElement.innerHTML = `The winner is ${types[winnerIdx].charAt(0).toUpperCase() + types[winnerIdx].slice(1)}!`;
    winnerElement.style.display = 'block';

    clearInterval(intervalId);
}

const play = (objects) => {
    const playerCounter = [0, 0, 0]

    for(let i=0; i < objects.length; i++) {
        const object = objects[i];
        const bbox = object.getBoundingClientRect();

        setVelocityBasedOnPositionRelativeToPlayground(bbox, object);
        for(let j=0; j < objects.length; j++) {
            if (i === j) continue;

            const otherObject = objects[j];
            if (otherObject.getAttribute('data-object') === object.getAttribute('data-object')) continue;

            const otherObjectBbox = otherObject.getBoundingClientRect();

            if (objectIntersectsOtherObject(bbox, otherObjectBbox)) {
                handleCollision(object, otherObject);
            }
        }

        playerCounter[object.getAttribute('data-object')] += 1;
        moveObject(bbox, object);
    }

    handleGameOver(playerCounter.indexOf(objectCount));
}

const init = () => {
    clientWidth = document.body.clientWidth;
    clientHeight = document.body.clientHeight;

    const objects = Array
        .from({length: objectCount})
        .map(_ => spawnObject());

    intervalId = setInterval(play, 1000/50, objects);
}

document.addEventListener('DOMContentLoaded', init);
