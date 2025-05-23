import numpy as np
import nibabel as nib
import albumentations as A
from albumentations.pytorch import ToTensorV2

# --- resize → tensor ---
_trans = A.Compose([A.Resize(256, 256), ToTensorV2()])


def preprocess_im(im: np.ndarray) -> np.ndarray:
    """Clamp negatives and min–max normalise."""
    im = im.copy()
    im[im < 0] = 0
    max_val = np.max(im)
    if max_val:
        im /= max_val
    return im


def read_nii(path: str) -> np.ndarray:
    img = nib.load(path)
    return img.get_fdata().astype("float32")


def apply_transformations(im: np.ndarray):
    if im.ndim == 3 and im.shape[-1] == 1:
        im = im.squeeze(-1)
    transformed = _trans(image=im)
    return transformed["image"].unsqueeze(0).float()