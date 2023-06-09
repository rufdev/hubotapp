import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION']='python'
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing import image

# Load the pre-trained model
model = keras.models.load_model('model1_catsVSdogs_10epoch.h5')

# Define the class labels
class_labels = ['cat', 'dog']

# Load the image and preprocess it
img_path = './onlinedataset/dog.4000.jpg'
img = image.load_img(img_path, target_size=(224, 224))
x = image.img_to_array(img)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = tf.reshape(x, [-1, 224, 224, 3])

# Make the prediction
y_pred = model.predict(x)
print(y_pred)
class_idx = tf.argmax(y_pred, axis=1)
class_label = class_labels[class_idx[0]]
print(class_label)
