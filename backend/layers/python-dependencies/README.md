# Python Dependencies Lambda Layer

This Lambda layer provides shared Python dependencies for the Color Code Research Hub report processing functions.

## Dependencies

The layer includes the following Python packages:

- **markdown>=3.5.0** - Convert Markdown to HTML for report formatting
- **bleach>=6.0.0** - HTML sanitization for security
- **beautifulsoup4>=4.12.0** - HTML/XML parsing and manipulation
- **lxml>=4.9.0** - XML and HTML processing (BeautifulSoup backend)
- **requests>=2.31.0** - HTTP library for API calls
- **boto3>=1.28.0** - AWS SDK for Python

## Usage

This layer is automatically attached to the `ReportProcessingFunction` and other Python-based Lambda functions that need these dependencies.

## Building the Layer

The layer is built automatically by SAM during deployment. The dependencies are installed into the `python/` directory structure required by Lambda layers.

To manually build the layer (if needed):

```bash
cd layers/python-dependencies
pip install -r requirements.txt -t python/
```

## Compatibility

- **Runtime**: Python 3.11
- **Architecture**: x86_64 (default Lambda architecture)
- **Retention**: The layer versions are retained even after stack deletion

## Layer ARN

After deployment, the layer ARN is available as a CloudFormation output:
- **Output Key**: `PythonDependenciesLayerArn`
- **Export Name**: `color-code-research-hub-PythonDependenciesLayer`