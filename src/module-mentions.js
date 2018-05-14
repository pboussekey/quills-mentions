var Delta = Quill.import('delta');
const Inline = Quill.import('blots/inline');

class MentionBlot extends Inline {
    static create(data) {  
        var node = super.create();
        if(data === true){
            node.classList.remove('editing');
            return node;
        }
        if(data.id){
            node.dataset.id = data.id;
            node.classList.remove('editing');
        }
        else{
            node.innerText = "@";
        }
        if(data.label){
            if(data.label.indexOf('@') !== 0){
                data.label = '@' + data.label;
            }
            node.dataset.label = data.label;
            node.dataset.text = data.text || data.label;

        }
        return node;
    }

    isInvalid(){
        return (!this.domNode.classList.contains('editing') 
              &&  this.domNode.getAttribute('data-id') !==  this.domNode.innerText)
         ||
         (this.domNode.classList.contains('editing') 
              && this.domNode.innerText.indexOf('@') !== 0
         );
    }

   optimize(){
        if(this.isInvalid()){
            setTimeout(function(){
               this.remove();
            }.bind(this));
        }
    }
}

MentionBlot.blotName = 'mention';
MentionBlot.tagName = 'mention';
MentionBlot.className = 'editing';

Quill.register(MentionBlot);

class Mention {

    constructor(quill, options) {
        this.quill = quill;
        this.options = options;
        this.openAt = null;
        this.endAt = null;
        this.at = [];
        this.container = document.querySelector(options.container);
        quill.on('text-change', this.onChange.bind(this));
        //Enter
        console.log("KEYBOARD?",quill.keyboard);
        quill.keyboard.addBinding(
          { 
            key: 13, 
            format: ['mention']
          }, function() {
            this.mention = quill.getLeaf(range.index)[0].parent;
            if(this.mention.domNode.classList.contains('editing')){
                this.selectElement();
            }
            else{
                this.mention.remove();
                this.mention = null;
            }
            return false;
        });
        //Space : Validate or strip mention
        quill.keyboard.addBinding({
          key : ' ',
          format: ["mention"],
          prefix : /^@.*$/,
         },function( range ){
            this.mention = quill.getLeaf(range.index)[0].parent;
            if(this.mention.domNode.classList.contains('editing')){
                if(this.promise){
                    return this.promise.then(function(){
                        if(this.at.length === 1){
                            this.selectElement();
                        }
                        else if(!this.at.length){
                            this.stripMention(this.mention);
                        }
                        return false;
                    }.bind(this));
                }
                else{
                    if(this.at.length === 1){
                        this.selectElement();
                    }
                    else if(!this.at.length){
                        this.stripMention(this.mention);
                    }
                    return false;
                }

            }
            else{
                this.mention.remove();
                this.mention = null;
            }
         }.bind(this));
        //Arrow left
        quill.keyboard.addBinding({
          key: 37,
        }, function( range ){
            var leaf = quill.getLeaf(range.index)[0];
            var parent = leaf.parent;
            var prev = leaf.prev;
            if(parent.domNode.tagName === 'MENTION' && !parent.domNode.classList.contains('editing')){
                quill.setSelection(parent.offset());
            }
            if((prev && range.index === prev.offset() + prev.domNode.innerText.length) 
                && prev.domNode.tagName === 'MENTION' && !prev.domNode.classList.contains('editing')){
                if(prev.offset() === 0){
                    return false;
                }
                quill.setSelection(prev.offset());
            }
            return true;
        }.bind(this));

        //Arrow up
        quill.keyboard.addBinding({
          key: 38,
          format: ["mention"]
        }, function(){
            if(this.at && this.at.length){
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                if(this.selectedElement){
                    this.selectedElement.classList.remove('selected');
                }
                this.selectedElement = this.container.querySelectorAll('button')[this.selectedIndex];
                if(this.selectedElement){
                    this.selectedElement.classList.add('selected');
                }
            }
        }.bind(this));

        //Arrow right
        quill.keyboard.addBinding({
          key: 39,
        }, function(range){
            var leaf = quill.getLeaf(range.index)[0];
            var parent = leaf.parent;
            var next = leaf.next;
            if(parent.domNode.tagName === 'MENTION' && !parent.domNode.classList.contains('editing')){
                quill.setSelection(parent.offset() + parent.domNode.innerText.length);
            }

            if(next  && range.index === next.offset()
                && next.domNode.tagName === 'MENTION' && !next.domNode.classList.contains('editing')){
                quill.setSelection(next.offset() + next.domNode.innerText.length);
            }
            return true;
        }.bind(this));
        //Arrow down
        quill.keyboard.addBinding({
            key: 40,
            format: ["mention"]
          }, function(){
                this.selectedIndex = Math.min(this.at.length, this.selectedIndex + 1);
                if(this.selectedElement){
                    this.selectedElement.classList.remove('selected');
                }
                this.selectedElement = this.container.querySelectorAll('button')[this.selectedIndex];
                if(this.selectedElement){
                    this.selectedElement.classList.add('selected');
                }
          }.bind(this));


    }

    onChange(delta, _ , source){
        console.log("ON CHANGE", delta, source);
        var index = Math.max(0,delta.ops.reduce(function(index, ops){
            return index + (ops.retain || 0) - (ops.delete || 0);
        },0));
        var leaf = this.quill.getLeaf(index);
        this.mention = null;
        if(leaf[0] && leaf[0].parent && leaf[0].parent.domNode.tagName === 'MENTION'){
            this.mention = leaf[0].parent;
        }
        if(source !== 'user'){
            return;
        }
        if(this.mention){
            this.searchAt(this.mention, this.mention.domNode.innerText.substring(1).trim());
        }
        else if(!this.mention && delta.ops.some(function(change){
                return change.insert === '@';
            })){
            this.mention = this.addMention(index);
            this.searchAt(this.mention, "");
        }
        if(this.mention){
            this.searchAt(this.mention, this.mention.domNode.innerText.substring(1).trim());
        }
    }

    searchAt(mention, search){
        var r = this.options.callback(search);
        if(this.last_search && search.trim() === this.last_search){
            return;
        }
        this.last_search = search.trim();

        if(r.then){
            this.promise = r;
            r.then(function(list){
                this.promise = null;
                if(search === this.last_search){
                    this.processList(mention, list, search);
                }
            }.bind(this));
        }
        else{
            this.processList(mention, r, search);
        }
    }

    addMention (index){
        this.quill.updateContents(new Delta()     
            .retain(index)
            .delete(1)               
        );
        var mention = {
            id : "",
            label : "",
            text : ""
        };
        this.quill.insertText(index," ", Quill.sources.API);
        this.quill.insertEmbed(index, 'mention', mention, Quill.sources.API);
        mention = (this.quill.getLeaf(index)[0].next || this.quill.getLeaf(index)[0].parent);
        this.quill.setSelection(index + 1);
        return mention;
    }

    validateMention(mention, element){
        var oldLength = mention.domNode.innerText.length;
        console.log("VALIDATE MENTION", mention, element);
        mention.insertAt(0, element.id);
        mention.deleteAt(element.id.length, oldLength);
        mention.domNode.setAttribute('data-id',element.id);
        mention.domNode.setAttribute('data-label', '@' + element.label);
        mention.domNode.setAttribute('data-text',element.text || element.label);
        mention.domNode.classList.remove('editing');
        this.emptyList();
        setTimeout(function(){
            this.quill.focus();
            this.quill.setSelection(mention.offset() + mention.domNode.innerText.length + 1);
        }.bind(this), 0);
    }

    stripMention(mention){
        var text = mention.domNode.innerText || "";
        var index = mention.offset();
        mention.deleteAt(0, mention.domNode.innerText.length);
        this.quill.insertText(index,text, Quill.sources.API);
        this.emptyList();
        setTimeout(function(){
               this.quill.focus();
               this.quill.setSelection(index + text.length);
        }.bind(this), 0);
    }

    emptyList(){
        this.container.innerHTML = '';
        this.selectedIndex = 0;
        this.selectedElement = null;
        document.removeEventListener('click', this.emptyList, true );
    }

    selectElement(){
        if(this.mention && this.at && this.at[this.selectedIndex]){
            this.validateMention(this.mention, this.at[this.selectedIndex]);
        }
        this.emptyList();
    }

    processList(mention, list){
        this.emptyList();
        this.at = list;
        list.forEach(function(element, index){ 
            var button = document.createElement('button');
            button.className = 'ql-mention-list-item';
            if(index === 0){
                button.classList.add('selected');
                this.selectedElement = button;
            }
            button.onclick = function(){ 
                this.validateMention(mention, element);
            }.bind(this);
            button.onmouseover = function(){ 
                this.selectedIndex = index;
                if(this.selectedElement){
                    this.selectedElement.classList.remove('selected');
                }
                this.selectedElement = button;
                button.classList.add('selected');
            }.bind(this);
            if(element.image){
                var image = new Image();
                image.src = element.image;
                button.appendChild(image);
            }
            else{
               var at = document.createElement('div');
               at.classList.add('at');
               at.innerText = '@';
               button.appendChild(at);
            }
            button.innerHTML += (element.text || element.label);
            this.container.appendChild(button);
        }.bind(this));
        document.addEventListener('click', this.emptyList.bind(this), true );
    } 

  }

Quill.register('modules/twicmention', Mention);

