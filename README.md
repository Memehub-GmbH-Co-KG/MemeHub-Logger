# MemeHub-Logger
Loggin for memehub


# Config

Config is done in the `config.yaml` file. See config.template.yaml for a template and documentation.
There are multiple available logging targets. Every one has it's own set of configuration options.
Every logging target has at least the following options:

 - `enabled`: Has to be set to true in order for the logging target to be initialized.
 - `level`: The minimum level a log needs in order to be send to this target.
 
The following logging targets are available:

 - `console`: Prints logs to the console / output stream.
   Availalbe options:
   - `timestamp`: A formatting for the timestamp. [moment.js `format` is used](https://momentjs.com/docs/#/displaying/format/).
   - `indentation`: A string to put before each line of detail data.
 - `cache`: Stores logs in memeory.
   Availalbe options:
   - `size`: The amonut of logs to keep in memory
   - `name`: The name of the cache. Having multiple caches with the same name results in undefined behavior.
 - `telegram`: Sends logs to a telegram group.
   Availalbe options;
   - `token`: The telegram bot token to use.
