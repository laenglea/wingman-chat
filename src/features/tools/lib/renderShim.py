# Defines the `render` helper exposed to user code. The worker reads any input
# images from the Pyodide FS, bridges the generation call to the main thread
# via `_wingman_render` (set as a Pyodide global by interpreter.worker.ts),
# and writes the resulting image back to the FS. Input paths travel as a JSON
# string because Pyodide does not forward Python lists to JS functions cleanly.
import json as _json
import os as _os


async def render(prompt, output, input=None):
    """Generate an image from a text prompt, or edit existing image(s) into a new one.

    Uses the configured image generation service — a network round trip to a
    remote model. Pass `input` to edit or restyle an existing image (or to
    combine several); omit it to generate from scratch. Use it for real raster
    images; to modify a chart you generated, regenerate it with the plotting
    library instead.

    Args:
        prompt: Description of the image to generate, or the edit to apply.
        output: Path where the resulting image is written (e.g. "out.png").
        input: Optional path — or list of paths — of input image(s) to edit
            or use as reference.

    Returns:
        The path of the written image file.
    """
    # str/PathLike count as a single path — only genuine collections fan out.
    paths = [] if input is None else [input] if isinstance(input, (str, _os.PathLike)) else list(input)
    paths = [_os.path.abspath(str(p)) for p in paths]
    return await _wingman_render(str(prompt), _os.path.abspath(str(output)), _json.dumps(paths))
