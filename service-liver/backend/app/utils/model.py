import torch
import segmentation_models_pytorch as smp

N_CLS = 1
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "model.pth"


def load_segmentation_model():
    model = smp.DeepLabV3Plus(classes=N_CLS, in_channels=1)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.to(DEVICE).eval()
    return model