This a proof of concept to for a migration from a gatsby repo building large scale number of pages from a markdown source to next. To also 
include image optimisation and migration scripting. 

## Getting Started

Copy any markdown content into the content directory:

```bash
// migrate old markdown patterns to JSX in the code. 
yarn migrate
// optimistise images. This is a one time event and not at build time
yarn optimise-images
// start the development server
yarn dev

// OR the production server
yarn build; yarn start
```

Open [http://localhost:3000/documentation](http://localhost:3000/documentation) with your browser to see the result.

More details to come. 