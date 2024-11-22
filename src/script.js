document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');

    const form = document.getElementById('todo-form');
    const editModal = document.getElementById('editModal');
    const closeModalButton = document.querySelector('.close-button');
    const saveEditButton = document.getElementById('saveEditButton');
    let currentTask;

    let tasks = await window.electron.loadTasks();
    console.log('Loaded tasks:', tasks);
    renderTasks(tasks);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
    
        const titleInput = document.getElementById('todo-input');
        const newTitle = titleInput.value.trim();
        const newRmaNumber = newTitle; // Assuming the RMA number is the same as the task title for now, adjust as needed
    
        if (newTitle !== "") {
            // Check if the RMA number is unique
            const isRmaUnique = !tasks.some(task => task.rmaNumber === newRmaNumber);
            
            if (!isRmaUnique) {
                alert('This RMA number already exists! Please use a unique number.');
                return; // Prevent the task from being added
            }
    
            const newTask = {
                rmaNumber: newRmaNumber,
                productName: '',
                receivedDate: '',
                description: '',
                column: 'inProgress-column'
            };
    
            tasks.push(newTask);
            renderTask(newTask);
            titleInput.value = "";
            window.electron.saveTasks(tasks);
        }
    });

    closeModalButton.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    saveEditButton.addEventListener('click', () => {
        const newTitle = document.getElementById('editInputTitle').value.trim();
        const newRmaNumber = document.getElementById('editInputRmaNumber').value.trim();
        const newReceivedDate = document.getElementById('editInputReceivedDate').value.trim();
        const newDescription = document.getElementById('editInputDescription').value.trim();
    
        if (newTitle !== "") {
            // Check if the RMA number is unique
            const isRmaUnique = !tasks.some(task => task.rmaNumber === newRmaNumber || (currentTask && currentTask.rmaNumber === newRmaNumber));
    
            if (!isRmaUnique) {
                alert('This RMA number already exists! Please use a unique number.');
                return; // Prevent the task from being saved
            }
    
            currentTask.productName = newTitle;
            currentTask.rmaNumber = newRmaNumber;
            currentTask.receivedDate = newReceivedDate;
            currentTask.description = newDescription;
    
            window.electron.saveTasks(tasks);
            renderTasks(tasks);
        }
    
        editModal.style.display = 'none';
    });
    

    function renderTasks(tasks) {
        const columns = document.querySelectorAll('.column');
        columns.forEach(column => column.innerHTML = ''); // Clear existing tasks
        tasks.forEach(task => renderTask(task));
    }

    function renderTask(task) {
        const taskElement = createTaskElement(task);
        console.log('Rendering task in column:', task.column);
        document.getElementById(task.column).appendChild(taskElement);
        initializeDragAndDrop(taskElement);
    }

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');

        const taskContent = document.createElement('div');
        taskContent.classList.add('task-content');
        taskContent.textContent = task.rmaNumber;

        const taskRMANumber = document.createElement('div');
        taskRMANumber.classList.add('task-content-small');
        taskRMANumber.textContent = task.productName;

        const taskReceivedDate = document.createElement('div');
        taskReceivedDate.classList.add('task-content-small');
        taskReceivedDate.textContent = task.receivedDate;
        

        const taskButtons = document.createElement('div');
        taskButtons.classList.add('task-buttons');

        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            currentTask = task;
            document.getElementById('editInputRmaNumber').value = task.rmaNumber;
            document.getElementById('editInputTitle').value = task.productName;
            document.getElementById('editInputReceivedDate').value = task.receivedDate;
            document.getElementById('editInputDescription').value = task.description;
            editModal.style.display = 'block';
        });

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteTask(taskElement);
            tasks = tasks.filter(t => t !== task);
            window.electron.saveTasks(tasks);
        });

        taskButtons.appendChild(editButton);
        taskButtons.appendChild(deleteButton);

        taskElement.appendChild(taskContent);
        taskElement.appendChild(taskRMANumber);
        taskElement.appendChild(taskReceivedDate);
        taskElement.appendChild(taskButtons);

        return taskElement;
    }

    function deleteTask(taskElement) {
        taskElement.remove();
    }

    function initializeDragAndDrop(taskElement) {
        taskElement.addEventListener('dragstart', () => {
            taskElement.classList.add('is-dragging');
        });
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('is-dragging');
            const columnId = taskElement.closest('.column').id;
            const task = tasks.find(t => t.text === taskElement.querySelector('.task-content').textContent);
            task.column = columnId;
            window.electron.saveTasks(tasks);
        });
    }

    const droppables = document.querySelectorAll(".column");

    droppables.forEach((zone) => {
        zone.addEventListener("dragover", (e) => {
            e.preventDefault();
            const bottomTask = insertAboveTask(zone, e.clientY);
            const curTask = document.querySelector(".is-dragging");

            if (!bottomTask) {
                zone.appendChild(curTask);
            } else {
                zone.insertBefore(curTask, bottomTask);
            }
        });
    });

    const insertAboveTask = (zone, mouseY) => {
        const els = zone.querySelectorAll(".task:not(.is-dragging)");

        let closestTask = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        els.forEach((task) => {
            const { top } = task.getBoundingClientRect();

            const offset = mouseY - top;

            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestTask = task;
            }
        });

        return closestTask;
    };
});