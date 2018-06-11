const MIN_CONFIDENCE = 0.4;
const MIN_POSE_POSITION_DIFFERENCE = 1000;

window.showNextPose = false;
document.addEventListener("click", logNextPose);

const NEEDED_PARTS = [
	"leftShoulder",
	"rightShoulder",
	"leftElbow",
	"rightElbow",
	"leftWrist",
	"rightWrist"
];

function checkValidPose(keypoints) {
	return keypoints.every(point => point.score > MIN_CONFIDENCE);
}

function getInterestingPoses(keypoints) {
	return keypoints.filter(point => {
		return NEEDED_PARTS.includes(point.part);
	});
}

const showYourselfEl = document.querySelector("[data-show-yourself]");
const resultEl = document.querySelector("[data-emoji]");

function showYourself(isValid) {
	if (isValid) {
		showYourselfEl.classList.add("-hide");
		resultEl.classList.remove("-hide");
	} else {
		showYourselfEl.classList.remove("-hide");
		resultEl.classList.add("-hide");
	}
}

function logNextPose() {
	console.log("Logging next pose");
	window.showNextPose = true;
}

function keypointsToStore(keypoints) {
	return keypoints.reduce((result, keypoint) => {
		result[keypoint.part] = {
			x: keypoint.position.x,
			y: keypoint.position.y
		};

		return result;
	}, {});
}

function searchEmoji(poseObj) {
	const emojis = Object.keys(window.EMOJIS);

	return emojis.reduce((result, storedEmojiKey) => {
		const storedEmoji = window.EMOJIS[storedEmojiKey];
		const bodyParts = Object.keys(storedEmoji);

		const storedEmojiKeyError = bodyParts.reduce(
			(totalErrorEmoji, bodyPart, bodyPartKey) => {
				if (!NEEDED_PARTS.includes(bodyPart)) {
					return totalErrorEmoji;
				}

				const xError = storedEmoji[bodyPart].x - poseObj[bodyPart].x;
				const yError = storedEmoji[bodyPart].y - poseObj[bodyPart].y;
				const totalError = Math.sqrt(xError * xError + yError * yError);

				return totalErrorEmoji + totalError;
			},
			0
		);

		result[storedEmojiKey] = storedEmojiKeyError;
		return result;
	}, {});
}

// main
function onPose(pose) {
	const interestingPoses = getInterestingPoses(pose.keypoints);
	const isValidPose = checkValidPose(interestingPoses);
	const poseObj = keypointsToStore(pose.keypoints);

	showYourself(isValidPose);

	if (isValidPose && window.showNextPose) {
		window.showNextPose = false;
		console.log(JSON.stringify(poseObj));
	}

	if (isValidPose) {
		const validEmojis = searchEmoji(poseObj);
		const validEmojisKeys = Object.keys(validEmojis);

		let maxError = Infinity;
		let winner = null;
		const bestEmoji = validEmojisKeys.forEach(emojiKey => {
			const emoji = validEmojis[emojiKey];

			if (emoji < maxError) {
				maxError = emoji;
				winner = emojiKey;
			}
		});

		// RENDER
		resultEl.style.backgroundColor = window.EMOJIS[winner].color;
		resultEl.querySelectorAll(".emoji").forEach(el => {
			el.classList.add("-hide");
		});
		resultEl.querySelector(`h1.${winner}`).classList.remove("-hide");
		resultEl.querySelector("h2").innerHTML = window.EMOJIS[winner].message;
	}
}
