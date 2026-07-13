dcrfunctions 	> backend
dcrsw 		> frontend

Run the following commands
npm install
npx func host start --pause-on-error --port 7071 --javascript
npm install -g azure-functions-core-tools@4 --unsafe-perm true

Install local dependencies
npm install

Install the tools globally by running the following on your terminal
npm install -g azure-functions-core-tools@4 --unsafe-perm true

Start the Azure Function host
func start
npx func host start --pause-on-error --port 7071 --javascript