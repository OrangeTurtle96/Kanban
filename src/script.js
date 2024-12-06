document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');

    const form = document.getElementById('todo-form');
    const editModal = document.getElementById('editModal');
    const closeModalButton = document.querySelector('.close-button');
    const saveEditButton = document.getElementById('saveEditButton');
    const titleInput = document.getElementById('todo-input');
    let tasks = await window.electron.loadTasks();
    let currentTask;

    renderTasks(tasks);

    // Event listeners
    form.addEventListener('submit', onAddTask);
    closeModalButton.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
    saveEditButton.addEventListener('click', saveTaskEdit);

    // Task management
    function onAddTask(e) {
        e.preventDefault();
        const newRmaNumber = titleInput.value.trim();

        if (newRmaNumber && !tasks.some(task => task.rmaNumber === newRmaNumber)) {
            const newTask = createTask(newRmaNumber);
            tasks.push(newTask);
            renderTask(newTask);
            titleInput.value = "";
            window.electron.saveTasks(tasks);
        } else {
            alert('This RMA number already exists! Please use a unique number.');
        }
    }

    function createTask(rmaNumber) {
        return {
            rmaNumber,
            productName: '',
            receivedDate: '',
            description: '',
            column: 'inProgress-column'
        };
    }

    function renderTasks(tasks) {
        const columns = document.querySelectorAll('.column');
        columns.forEach(column => column.innerHTML = ''); // Clear columns
        tasks.forEach(renderTask);
    }

    function renderTask(task) {
        const taskElement = createTaskElement(task);
        document.getElementById(task.column).appendChild(taskElement);
        initializeDragAndDrop(taskElement);
    }

    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.setAttribute('draggable', 'true');

        const taskContent = createTaskContent(task);
        const taskButtons = createTaskButtons(task);

        taskElement.append(taskContent, taskButtons);
        return taskElement;
    }

    function createTaskContent(task) {
        const taskContent = document.createElement('div');
        taskContent.classList.add('task-content');
        taskContent.textContent = task.rmaNumber;

        const taskRMANumber = document.createElement('div');
        taskRMANumber.classList.add('task-content-small');
        taskRMANumber.textContent = task.productName;

        const taskReceivedDate = document.createElement('div');
        taskReceivedDate.classList.add('task-content-small');
        taskReceivedDate.textContent = task.receivedDate;

        return [taskContent, taskRMANumber, taskReceivedDate];
    }

    function createTaskButtons(task) {
        const taskButtons = document.createElement('div');
        taskButtons.classList.add('task-buttons');

        const editButton = createButton('Edit', () => openEditModal(task));
        const deleteButton = createButton('Delete', () => deleteTask(task));

        taskButtons.append(editButton, deleteButton);
        return taskButtons;
    }

    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.classList.add(`${text.toLowerCase()}-button`);
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    function openEditModal(task) {
        currentTask = task;
        document.getElementById('editInputRmaNumber').value = task.rmaNumber;
        document.getElementById('editInputTitle').value = task.productName;
        document.getElementById('editInputReceivedDate').value = task.receivedDate;
        document.getElementById('editInputDescription').value = task.description;
        editModal.style.display = 'block';
    }

    function closeEditModal() {
        editModal.style.display = 'none';
    }

    function saveTaskEdit() {
        const newTitle = document.getElementById('editInputTitle').value.trim();
        const newRmaNumber = document.getElementById('editInputRmaNumber').value.trim();
        const newReceivedDate = document.getElementById('editInputReceivedDate').value.trim();
        const newDescription = document.getElementById('editInputDescription').value.trim();

        if (newRmaNumber !== "") {
            Object.assign(currentTask, {
                productName: newTitle,
                rmaNumber: newRmaNumber,
                receivedDate: newReceivedDate,
                description: newDescription
            });

            window.electron.saveTasks(tasks);
            renderTasks(tasks);
            closeEditModal();
        }
    }

    function deleteTask(task) {
        tasks = tasks.filter(t => t !== task);
        window.electron.saveTasks(tasks);
        renderTasks(tasks);
    }

    // Drag and Drop
    function initializeDragAndDrop(taskElement) {
        taskElement.addEventListener('dragstart', () => taskElement.classList.add('is-dragging'));
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('is-dragging');
            updateTaskColumn(taskElement);
        });
    }

    function updateTaskColumn(taskElement) {
        const columnId = taskElement.closest('.column').id;
        const rmaNumber = taskElement.querySelector('.task-content').textContent.trim();
        const task = tasks.find(t => t.rmaNumber === rmaNumber);
        if (task) {
            task.column = columnId;
            window.electron.saveTasks(tasks);
        }
    }

    const droppables = document.querySelectorAll('.column');
    droppables.forEach(zone => zone.addEventListener('dragover', handleDragOver));

    function handleDragOver(e) {
        e.preventDefault();
        const curTask = document.querySelector('.is-dragging');
        const bottomTask = insertAboveTask(e.clientY, e.target);
        if (!bottomTask) {
            e.target.appendChild(curTask);
        } else {
            e.target.insertBefore(curTask, bottomTask);
        }
    }

    function insertAboveTask(mouseY, zone) {
        const tasks = zone.querySelectorAll('.task:not(.is-dragging)');
        let closestTask = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        tasks.forEach(task => {
            const { top } = task.getBoundingClientRect();
            const offset = mouseY - top;
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestTask = task;
            }
        });
        return closestTask;
    }
});
