import cv2
import numpy as np
import torch
from typing import List, Union


def find_contours(mask: Union[np.ndarray, torch.Tensor]) -> List[List[List[int]]]:
    if isinstance(mask, torch.Tensor):
        mask = mask.cpu().numpy()

    mask_uint8 = ((mask > 0).astype(np.uint8)) * 255
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    output: List[List[List[int]]] = []
    for cnt in contours:
        output.append([[int(p[0][0]), int(p[0][1])] for p in cnt])
    return output
