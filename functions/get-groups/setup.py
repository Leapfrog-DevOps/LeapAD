"""Package setup."""

import os
import setuptools

# Requirements
requirements = [
    "ldap3==2.9.1",
]

# Development Requirements
requirements_dev = ["pytest==7.4.0", "black==23.9.1"]

with open("./README.md", "r") as f:
    long_description = f.read()

setuptools.setup(
    name="get-groups",
    author="LEAP-AD",
    author_email="core-devops@lftechnology.com",
    description="Lambda functions for helipad for active directory",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/koiralaprt/admgmt/functions/get-groups",
    packages=setuptools.find_packages(),
    install_requires=requirements,
    extras_require={"dev": requirements_dev},
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
)
