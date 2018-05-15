# Quilljs mentions

Custom module for [Quill.js](https://github.com/quilljs/quill). to allow mentions.

## Usage

### Configuration

To use mentions, initiate a quill editor and add the **twicmentions** configuration key when defining your quill modules.

```
var quill = new Quill('#editor', {
    modules:{
        twicmention : {
            callback : callback,
            container : "#container"
        }
      }
});
```

**callback : ** Function used to retrieved mentions. It can be synchronous or asynchronous (return a promise).
IN - search : string
OUT - array : 
```
[
    {
        id : "identifier of your mention",
        label : "the text of your mention that will appear in text editor"
        text : "the text of your mention that will appear in search list (Facultative)"
        image : "the image of your mention that will appear in search list (Facultative)"
    }
]
```
**container : ** Is a css selector of the html element that will contains the result



