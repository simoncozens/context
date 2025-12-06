# contxt Font Editor

## Packaging for Deployment

To prepare a new version for deployment, run the packaging script from the repository root:

```bash
./package.sh
```

This script automatically increments the version number in `webapp/coi-serviceworker.js`, which forces cache invalidation for all users. When deployed, users will see an orange update notification button in the title bar, allowing them to reload and get the latest version without manually clearing their browser cache.
