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
   - `indentation`: Changes how logs are indented before printing.
     - `head`: A string to put before the title, but after the timestamp.
     - `data`: A string to put before each line of detail data.

 - `RRB_QUEUE_LOG`: The queue to save logs
 - `RRB_QUEUE_GET`: The queue to get logs
 - `RRB_PREFIX`: The prefix for all messages
 - `BOT_TOKEN`: The bot token used for sending logs to telegram
