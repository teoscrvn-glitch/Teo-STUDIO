# Backward-compatible entry point for the current V58.1 regression suite.
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test-v58.1-note-designer-flow.py')), run_name='__main__')
