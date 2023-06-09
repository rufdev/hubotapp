const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const IMAGE_WIDTH = 224;
const IMAGE_HEIGHT = 224;

const TRAIN_DIR = '../dataset';
const VAL_DIR = '../onlinedataset/dataset/test_set';

const NUM_CLASSES = 2;
const BATCH_SIZE = 32;
const NUM_EPOCHS = 10;
const STEPS_PER_EPOCH = 50;
const VALIDATION_STEPS = 10;

async function loadImagesFromDir(dirPath) {
  const files = fs.readdirSync(dirPath);
  const images = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const image = await loadImage(filePath);
    images.push(image);
  }

  return images;
}

async function createDataset(dirPath) {
  const images = await loadImagesFromDir(dirPath);

  const data = tf.data.generator(function* () {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
      const imageData = ctx.getImageData(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT).data;

      const input = tf.tensor(imageData, [IMAGE_WIDTH, IMAGE_HEIGHT, 4], 'float32');
      const output = tf.oneHot(tf.tensor1d([Math.floor(i / (images.length / NUM_CLASSES))], 'int32'), NUM_CLASSES);

      yield { xs: input, ys: output };
    }
  });

  return data;
}

async function train() {
  const trainData = await createDataset(TRAIN_DIR);
  const valData = await createDataset(VAL_DIR);

  const model = tf.sequential({
    layers: [
      tf.layers.conv2d({
        inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, 4],
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
      }),
      tf.layers.maxPooling2d({ poolSize: [2, 2] }),
      tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
      tf.layers.maxPooling2d({ poolSize: [2, 2] }),
      tf.layers.conv2d({ filters: 128, kernelSize: 3, activation: 'relu' }),
      tf.layers.maxPooling2d({ poolSize: [2, 2] }),
      tf.layers.conv2d({ filters: 256, kernelSize: 3, activation: 'relu' }),
      tf.layers.maxPooling2d({ poolSize: [2, 2] }),
      tf.layers.flatten(),
      tf.layers.dense({ units: 256, activation: 'relu' }),
      tf.layers.dropout({ rate: 0.5 }),
      tf.layers.dense({ units: NUM_CLASSES, activation: 'softmax' }),
    ]
  });

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  await model.fitDataset(trainData, {
    epochs: NUM_EPOCHS,
    validationData: valData,
    stepsPerEpoch: STEPS_PER_EPOCH,
    validationSteps: VALIDATION_STEPS
  });

  console.log('Model trained successfully');
}

module.exports = train;