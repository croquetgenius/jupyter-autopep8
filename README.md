# Jupyter autopep8

This extension reformats/prettifies code in a notebook's code cell. 
Under the hood, it uses the [autopep8](https://github.com/hhatto/autopep8) Python module to reformat Python code to conform to the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide.

**pre-requisites:** of course, you must have some of the corresponding packages installed:

```
pip install autopep8 [--user]
``` 

Then the extension provides

- a toolbar button
- a keyboard shortcut for reformatting the current code-cell (default: Ctrl-L)

Syntax shall be correct. The extension will also point basic syntax errors. 


Installation
------------

If you use [jupyter-contrib-nbextensions](https://github.com/ipython-contrib/jupyter_contrib_nbextensions), proceed as usual. 

Otherwise, you can still install/try the extension from personal repo, using
```
jupyter nbextension install https://github.com/kenkoooo/jupyter-autopep8/archive/master.zip --user
jupyter nbextension enable jupyter-autopep8-master/jupyter-autopep8
```
