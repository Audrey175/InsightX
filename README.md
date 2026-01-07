# InsightX

## Model weights placement
- `backend/models/unet_brats.pth` for MRI prediction
- `backend/models/xray_model.pth` for X-ray prediction

If weights are missing, prediction endpoints return HTTP 500 with a clear path message.
Use `GET /health/models` to verify model availability.
