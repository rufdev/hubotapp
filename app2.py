import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION']='python'

import shutil
import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflowjs as tfjs
# from keras.preprocessing.image import ImageDataGenerator
# from keras.utils import to_categorical
from sklearn.model_selection import train_test_split
# import matplotlib.pyplot as plt

import random

Image_Width=224
Image_Height=224
Image_Size=(Image_Width,Image_Height)
Image_Channels=3

filenames=os.listdir("./dataset")

categories=[]

for f_name in filenames:
    category=f_name.split('.')[0]
    if category=='dog':
        categories.append(1)
    else:
        categories.append(0)

df=pd.DataFrame({
    'filename':filenames,
    'category':categories
})

print (df)


model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(32,(3,3),activation='relu',input_shape=(224,224,3)),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.MaxPooling2D(pool_size=(2,2)),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Conv2D(64,(3,3),activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.MaxPooling2D(pool_size=(2,2)),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Conv2D(128,(3,3),activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.MaxPooling2D(pool_size=(2,2)),
    tf.keras.layers.Dropout(0.25),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(512,activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(2,activation='softmax')
])


model.compile(loss='categorical_crossentropy', optimizer='rmsprop',metrics=['accuracy'])


earlystop = tf.keras.callbacks.EarlyStopping(patience = 10)
learning_rate_reduction = tf.keras.callbacks.ReduceLROnPlateau(monitor = 'val_acc',patience = 2,verbose = 1,factor = 0.5,min_lr = 0.00001)
callbacks = [earlystop,learning_rate_reduction]

df["category"] = df["category"].replace({0:'cat',1:'dog'})

train_df,validate_df = train_test_split(df,test_size=0.20, random_state=42)

train_df = train_df.reset_index(drop=True)

validate_df = validate_df.reset_index(drop=True)

total_train=train_df.shape[0]


total_validate=validate_df.shape[0]

batch_size=15


train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rotation_range=15, rescale=1./255, shear_range=0.1, zoom_range=0.2, horizontal_flip=True, width_shift_range=0.1, height_shift_range=0.1 )
train_generator = train_datagen.flow_from_dataframe(train_df, "./dataset" ,x_col='filename' ,y_col='category', target_size=Image_Size, class_mode='categorical', batch_size=batch_size)

validation_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
validation_generator = validation_datagen.flow_from_dataframe( validate_df, "./dataset", x_col='filename', y_col='category', target_size=Image_Size, class_mode='categorical', batch_size=batch_size )

epochs=10 
history = model.fit( train_generator, epochs=epochs, validation_data=validation_generator, validation_steps=total_validate//batch_size, steps_per_epoch=total_train//batch_size, callbacks=callbacks )

model.save("model.h5")
tfjs.converters.save_keras_model(model, 'tfjs_model')