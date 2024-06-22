import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION']='python'

import tensorflow as tf
import tensorflowjs as tfjs
# Assuming 'model.h5' is the path to your model file
model_path = 'bottles_best_model.h5'

# Load the model
model = tf.keras.models.load_model(model_path)

print("Model loaded successfully.")

# Convert the model
tfjs.converters.save_keras_model(model, 'tfjs_model_bottles_best_model')
