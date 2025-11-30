def reconstruct_3d(filepath: str) -> str:
    import brainchop

    model = brainchop.load_model("brain")
    volume = brainchop.load_image(filepath)
    segmented = model.predict(volume)

    output_path = filepath.replace(".nii", "_3d.nii")
    brainchop.save(segmented, output_path)

    return output_path
