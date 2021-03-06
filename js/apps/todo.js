import Storage from '../storage.js'
import DragDrop from '../dragdrop.js'
import Validator from '../validator.js'

export default class Todo {

    defaultTodo = {
        lists: [],
        removed: [],
        request: [],
        selectedId: null,
        lastUpload: null,
        lastRequest: null
    };
    
    api = null;

    constructor(main) {
        this.main = main;
        this.todo = this.defaultTodo;
        

        this.todoNav = document.querySelector('[data-todo-nav]');
        this.todoActive = document.querySelector('[data-todo-active]');
        this.todoFinish = document.querySelector('[data-todo-finish]');
        this.todoTitle = document.querySelector('[data-todo-title]');
        this.todoCount = document.querySelector('[data-todo-count]');
        const removeProject = document.querySelector('[data-todo-removeProject]');

        if (new Storage().getStorage('todo') !== null) {
            this.todo = new Storage().getStorage('todo')
        } 

        const createForm = document.querySelector('[data-todo-create]');
        const createTask = document.querySelector('[data-todo-task]'); 
        createForm.addEventListener('submit', e => {
            e.preventDefault();
            this.createList();
        });
        createTask.addEventListener('submit', e => {
            e.preventDefault();
            this.createTask();
        })
        removeProject.addEventListener('click', e => {
            e.preventDefault();
            const selectedProject = this.todo.lists.find(list => list.id == this.todo.selectedId);

            new Validator(this.main, 'removeTodo', selectedProject.api);

            this.todo.lists = this.todo.lists.filter(list => list.id !== this.todo.selectedId);
            this.saveAndRender();
        })

        this.todoNav.addEventListener('click', e => {
            if (e.target.tagName.toLowerCase() === "li") {
                this.todo.selectedId = e.target.dataset.listId;
                this.saveAndRender();
            }
        })


       this.saveAndRender();

    }

    async setApi() {
        let api = await new Validator(this.main, 'getTodo');
        api = api[0];
        api.todo.forEach(todo => {
            const localStorage = this.todo.lists.find(list => list.api === todo.todolist_id);
           
            if (localStorage == "null" || localStorage == null) {
                const temp = {id: todo.todolist_id, api: todo.todolist_id,name: todo.todolist_name,todo: []};
                this.todo.lists.push(temp);

            }
            
            
        }) 
    
        if (this.todo.selectedId !== null) {
            const newTodo = [];
            const activeList = this.todo.lists.find(list => list.id === this.todo.selectedId);
            api.items.forEach(item => {
                
                const valid  = api.todo.find(todo => todo.todolist_id === item.todolist_id);
    
                const localStorage = activeList.todo.find(todo => todo.apid === item.item_id);

                if (valid == null || valid == "null") {
                    new Validator(this.main, 'removeTodoItem', item.item_id);
                }
    

      
                if (localStorage == null || localStorage == "null") {
                    
                    const temp = {id: item.item_id,api: item.todolist_id,apid:item.item_id, name: item.item_name,active: item.item_content};
                    
                    if (item.todolist_id == activeList.api) {
                        activeList.todo.push(temp);
                    }

                } else {
                    let active = (item.item_content == "True") ? true : false;
                    localStorage.active = active;
                }

        
    
            })
        }

    }

    
    async saveAndRender() {

        await this.save();
        this.render();

    }

    async save() {
        await this.setApi();
        new Storage('set', 'todo', this.todo);
    }

    render() {

        this.clearElement(this.todoNav);
        this.renderNav();

        this.clearElement(this.todoActive);
        this.clearElement(this.todoFinish);

        const selectedList = this.todo.lists.find(list => list.id == this.todo.selectedId);
        if (selectedList == null || selectedList == 'null'){ 
            this.todoTitle.textContent = "Create a Project";
            this.todoCount.textContent = "";    
            return;
        }

        this.todoTitle.textContent = selectedList.name;
        this.renderCount(selectedList);
        this.renderTasks(selectedList);
        

        new DragDrop(this);
    }

    renderNav() {

       const temp = this.convertToArray(this.todo.lists);

        temp.forEach(list => {
            const elm = document.createElement('li');
            elm.dataset.listId = list.id;
            elm.textContent = list.name;

            if (list.id === this.todo.selectedId) {
                elm.classList.add('active-list');
            }


            if (temp.length <= 1) {
                elm.classList.add('active-list');
                this.todo.selectedId = list.id;
                this.save();
            }

            this.todoNav.appendChild(elm);

        });
    }

    renderCount(selectedList) {

        let active = 0;
        let finish = 0;

        selectedList.todo.forEach(task => {
            if (task.active) {
                active++; 
            } else {
                finish++;
            }
        })

        
        if (active == 0 && finish == 0) {
            this.todoCount.textContent = "Create some tasks and progress!";
            return;
        }

        if (active == 0 && finish > 0) {
            this.todoCount.textContent = "All Tasks have been finished!";
            return;
        }

        if (active > 0 && finish == 0) {
            this.todoCount.textContent = `${active} tasks remain...`;
            return;
        }

        if (active > 0 && finish > 0) {
            this.todoCount.textContent = `${finish} tasks down, ${active} to go!`
        }
        

    }

    renderTasks(selectedList) {

        selectedList.todo.forEach(task => {

            const elm = document.createElement('li');
            elm.setAttribute('data-draggable', true);
            elm.textContent = task.name;
            elm.id = task.id;

            if (task.active) {
                this.todoActive.appendChild(elm)
            } else {
                this.todoFinish.appendChild(elm);
            }
        })

    }

    async createList() {

        
        const form = document.querySelector('[data-todo-create]');
        const input = document.querySelector('[data-todo-create] input');
        let data = new FormData(form);
        if (data.get('task') == "") return;
        
        const api = await new Validator(this.main, 'createTodo',data.get('task'));
        const temp = {id: Date.now().toString(), api: api,name: data.get('task'),todo: []};
        this.todo.lists.push(temp);
        input.value ="";
        this.saveAndRender();
    }

    async createTask() {
        const form = document.querySelector('[data-todo-task]');
        const input = document.querySelector('[data-todo-task] input');
        let data = new FormData(form);
        if (data.get('task') == "") return;

       
        const selectedList = this.todo.lists.find(list => list.id === this.todo.selectedId);
        const temp = {id: Date.now().toString(),api: selectedList.api,apid:null, name: data.get('task'),active: true}
        const apid = await new Validator(this.main, 'addTodoItem', temp);
        temp.apid = apid;
        input.value = "";
        selectedList.todo.push(temp);
        this.save();
        this.main.doEvent('todo');
    }



    convertToArray(obj) {
        let arr = [];
        obj = Object.entries(obj);
        obj.forEach(([keys,item]) => {
            arr.push(item);
        })
        return arr;
    }




    async dragEnd(e, child) {
        const selectedList = this.todo.lists.find(list => list.id === this.todo.selectedId);
        const parent = e.target.parentNode;
        if (parent.hasAttribute('data-todo-remove')) {
            const selectedItem = selectedList.todo.find(task => task.id === child.id);
            this.todo.removed.push(selectedItem);
            selectedList.todo = selectedList.todo.filter(task => task.id !== child.id);
            child.remove();
            await new Validator(this.main, 'removeTodoItem', selectedItem.apid);

            this.save();
            this.main.doEvent('todo');
        }

        if (parent.hasAttribute('data-todo-finish')) {

            const selectedItem = selectedList.todo.find(task => task.id === child.id);
            selectedItem.active = false;
            const active = this.todoActive.querySelectorAll('li');
            const finish = this.todoFinish.querySelectorAll('li');
            const todo = [...active, ...finish];
            let temp = [];
            todo.forEach(elm =>  {
                const selectedItem = selectedList.todo.find(task => task.id === elm.id);
                temp.push(selectedItem);
            });
            selectedList.todo = temp;

            await new Validator(this.main, 'removeTodoItem', selectedItem.apid);
            const apid = await new Validator(this.main, 'addTodoItem', selectedItem);
            selectedItem.apid = apid;
            this.save();
            this.main.doEvent('todo');

        }

        if (parent.hasAttribute('data-todo-active')) {
            const selectedItem = selectedList.todo.find(task => task.id === child.id);
            selectedItem.active = true;

            const active = this.todoActive.querySelectorAll('li');
            const finish = this.todoFinish.querySelectorAll('li');
            const todo = [...active, ...finish];
            let temp = [];
            todo.forEach(elm =>  {
                const selectedItem = selectedList.todo.find(task => task.id === elm.id);
                temp.push(selectedItem);
            });
            selectedList.todo = temp;
            await new Validator(this.main, 'removeTodoItem', selectedItem.apid);
            const apid = await new Validator(this.main, 'addTodoItem', selectedItem);
            selectedItem.apid = apid;
            this.save();
            this.main.doEvent('todo');
        }


    }

    
    clearElement(elm) {
        while(elm.firstChild) {
            elm.removeChild(elm.firstChild);
        }
    }

}