import numpy as np
from main import yaw_proxy

def test_yaw_proxy_centered_and_turned():
    centered = np.array([[40, 50], [60, 50], [50, 60], [0, 0], [0, 0]], dtype=float)
    turned = np.array([[40, 50], [60, 50], [56, 60], [0, 0], [0, 0]], dtype=float)
    assert abs(yaw_proxy(centered)) < 1e-6
    assert yaw_proxy(turned) - yaw_proxy(centered) > 0.12
