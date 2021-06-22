import setuptools

setuptools.setup(
    name="pyinterp",
    version="0.0.1",
    author="udem-dlteam",
    author_email="author@example.com",  # change!
    description="pyinterp - Python parsing infrastructure",
    url="https://github.com/udem-dlteam/pyinterp",
    packages=["pyinterp", "pyinterp/zast", "pyinterp/pyinterp"],
    include_package_data=True,
    python_requires='>=3.8',
)
