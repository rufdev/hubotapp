import os
import shutil

source_dir = "./kagglecatsanddogs_5340/PetImages/Dog"
dest_dir = "./onlinedataset"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for filename in os.listdir(source_dir):
    new_filename = "dog." + filename
    shutil.copy(os.path.join(source_dir, filename), os.path.join(dest_dir, new_filename))