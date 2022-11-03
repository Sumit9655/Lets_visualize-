// Tree will be stored as object.
let data = { value: null, children: [] };
// Current available id for the node. We will give each node a unique id and put this as their html element "id".
let curId = 0,ans=0;

const width = Math.max(100, window.innerWidth - 50);
const height = Math.max(100, window.innerHeight - 100);
const nodeRadius = 20;
const LinkStroke = 4;
const animationDuration = 750;
const padding = 22;

d3.select('.Canvas').append('svg').append('g');

// During insertion or deletion visualization process disbale the buttons
const freezeButtons = () => {
    document.getElementById('InsertButton').disabled = true;
    document.getElementById('DeleteButton').disabled = true;
};
const unfreezeButtons = () => {
    document.getElementById('InsertButton').disabled = false;
    document.getElementById('DeleteButton').disabled = false;
};

// To put delay between visualization.
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const update = (oldData, newData, parentValue, childValue) => {
    // childValue is node we want to insert/delete and parentValue is parent of node we want to insert/delete.

    // Create the old and new updated tree.
    const treemap = d3.tree().size([width, height]);
    const oldTree = treemap(d3.hierarchy(oldData, (d) => d.children));
    const newTree = treemap(d3.hierarchy(newData, (d) => d.children));

    // Convert both tres from objects to array.
    const oldTreeArray = oldTree.descendants();
    const newTreeArray = newTree.descendants();
    // Putting old and new co-ordinates of nodes in the same array.
    for (let i = 0; i < newTreeArray.length; i++) {
        let oldPosition = {};
        // Traverse the old tree and find the old co-ordinates.
        for (let j = 0; j < oldTreeArray.length; j++) {
            if (newTreeArray[i].data.value == childValue) {
                // Node which we are going to insert, there is no old co-oridnates available
                // So we are going to use the co-ordinates of parent node.
                if (oldTreeArray[j].data.value == parentValue) {
                    oldPosition = oldTreeArray[j];
                }
            } else {
                if (oldTreeArray[j].data.value == newTreeArray[i].data.value) {
                    oldPosition = oldTreeArray[j];
                }
            }
        }
        newTreeArray[i].oldX = oldPosition.x || 0;
        newTreeArray[i].oldY = (oldPosition.y || 0) + padding;
        newTreeArray[i].y += padding;
    }

    // Remove the old tree from canvas. we will draw new one.
    d3.select('.Canvas > svg g').remove();
    d3.select('.Canvas > svg').append('g');

    // Create all the edges and put them in new array.
    let allLinks = [];
    for (let i = 0; i < newTreeArray.length; i++) {
        for (let j = 0; j < 1; j++) {
            if (newTreeArray[i].data.value != null && newTreeArray[i].children[j].data.value != null) {
                allLinks.push({
                    parent: newTreeArray[i],
                    child: newTreeArray[i].children[j],
                });
            }
        }
    }

    // We will draw edge(links) 1 times. why?
    // When we traverse the BST, it will be easy to show animation of searching. we will paint top edge with some color while searching node.
    for (let i = 0; i < 1; i++) {
        const lineId = i == 0 ? 'Under' : '';

        // Drawing edges on canvas with some styles and co-ordinates.
        const links = d3
            .select('.Canvas > svg g')
            .selectAll('g.link')
            .data(allLinks)
            .enter()
            .append('g')
            .append('line')
            .attr('id', (d) => `${lineId}link_Source_${d.parent.data.nodeId}_Dest_${d.child.data.nodeId}`)
            .attr('stroke-width', LinkStroke)
            .attr('stroke', 'black')
            .attr('x1', (d) => d.parent.oldX)
            .attr('y1', (d) => d.parent.oldY)
            .attr('x2', (d) => d.child.oldX)
            .attr('y2', (d) => d.child.oldY);
        // Transition from old tree to new tree. move old edges to new edges using co-ordinates.
        links
            .transition()
            .duration(animationDuration)
            .attr('x1', (d) => d.parent.x)
            .attr('y1', (d) => d.parent.y)
            .attr('x2', (d) => d.child.x)
            .attr('y2', (d) => d.child.y);
    }

    // Draw nodes and their value on screen using old tree co-ordinates.
    const nodes = d3
        .select('.Canvas > svg g')
        .selectAll('g.node')
        .data(newTree)
        .enter()
        .append('g')
        .attr('id', (d) => `node${d.data.nodeId}`)
        .attr('class', (d) => (d.data.value != null ? (d.data.nodeId == curId-1 ? 'topelement' : 'node') : 'null-node'));
    nodes
        .append('circle')
        .attr('id', (d) => `circle${d.data.nodeId}`)
        .attr('r', nodeRadius)
        .attr('cx', (d) => d.oldX)
        .attr('cy', (d) => d.oldY)
        .attr('value', (d) => d.data.value);
    nodes
        .append('text')
        .attr('dx', (d) => d.oldX)
        .attr('dy', (d) => d.oldY)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .text((d) => d.data.value);

    // Move nodes from old co-ordinate to new co-ordinates.
    nodes
        .transition()
        .duration(animationDuration)
        .attr('transform', (d) => {
            if (d.data.value != null) return `translate(${parseInt(d.x - d.oldX)}, ${parseInt(d.y - d.oldY)})`;
            else return 'translate(0,0)';
        });

    data = newData;
};

const addNode = async () => {
    // Get the node value from input field and verify it's value/type.
    let val = document.getElementById('InsertNodeField').value;
    if (val == '') {
        return;
    }
    if (isNaN(val)) {
        alert('Only integer values allowed');
        return;
    }
    val = parseInt(val);
    document.getElementById('InsertNodeField').value = '';

    // Freeze(disable) insert and delete buttons.
    freezeButtons();

    // Copying object without reference.
    let oldData = JSON.parse(JSON.stringify(data));
    let newData = JSON.parse(JSON.stringify(data));
    let node = newData;
    let parent = null;

    while (true) {
        if (node.value == null) {
            // If node value is null then that means we already reached leaf node. Insert new node here.
            await sleep(400);

            // Create a node with given value.
            const newChild = {
                nodeId: curId,
                value: val,
                children: [{ value: null }],
            };

            if (parent) {
                // If tree is not empty then "parent" will not be null. Now link newly created node with it parent node.
                parent.children[0] = newChild;
            } else {
                // If tree is empty then this newly created node will act as tree.
                newData = newChild;
            }
            curId++;
            update(oldData, newData, (parent ? parent.value : -1), (parent ? val : -1));
            
            await sleep(300);
            break;
        }

        const nodeElement = document.getElementById(`node${node.nodeId}`);
        if (nodeElement) nodeElement.className.baseVal = 'highlightedNode';

        if (node.value == val) {
            // If value user is trying to insert already exist then show message
            alert('Value already exists in stack');
            update(oldData, oldData, -1, -1);
            break;
        }

        parent = node;
        node = node.children[0];


        // Show the edge traversing animation.
        const linkElement = document.getElementById(`link_Source_${parent.nodeId}_Dest_${node.nodeId}`);
        if (linkElement) {
            linkElement.className.baseVal = 'LinkAnimation';
            await sleep(750);
        }
    }
    unfreezeButtons();
};

// Delete the given node and return updated tree.
const deleteNodeRecur = (newData, val) => {
    if (newData.value == null) {
        return newData;
    }
    let parent = newData, node = newData;
    while (node.value != null) {
        parent = node;
        node = node.children[0];
    }
    if (val != parent.value) {
        alert('Only top element is allowed to delete');
        return newData;
    } else {
        parent.value = null;
        return newData;
    }
};

const deleteNode = async () => {
    freezeButtons();
    // Copying object without reference.
    let oldData = JSON.parse(JSON.stringify(data));
    let newData = JSON.parse(JSON.stringify(data));
    let node = newData;
    let parent = null;

    // Get the node value from input field and verify it's type.
    let val = document.getElementById('DeleteNodeField').value;
    if (val == '') {
        let parent = node;
        while (node.value != null) {
            parent = node;
            node = node.children[0];
        }
        val = parent.value;
        await sleep(500);
        newData = deleteNodeRecur(newData, val);  
        curId--;
        update(oldData, newData, -1, -1);
        unfreezeButtons();
        return;
    }
    if (isNaN(val)) {
        alert('Only integer values allowed');
        return;
    }
    val = parseInt(val);
    document.getElementById('DeleteNodeField').value = '';
    while (true) {
        if (node.value == null) {
            alert('Value is not present in stack');
            update(oldData, newData, -1, -1);
            unfreezeButtons();
            break;
        }

        const nodeEle = document.getElementById(`node${node.nodeId}`);
        if (nodeEle) nodeEle.className.baseVal = 'highlightedNode';

        parent = node;

        if (node.value == val) {
            // Found the node which we want to delete. We just create updated tree with some other function and display it.
            // More better way will be, if there are 2 childs to this node then show animation to find inorder successor.
            await sleep(500);
            newData = deleteNodeRecur(newData, val);
            curId--;
            update(oldData, newData, -1, -1);
            break;
        } else {
            // Go to left or right subtree depending on the value we want to delete.
            node = node.children[0];

            // Show the edge animation.
            const linkElement = document.getElementById(`link_Source_${parent.nodeId}_Dest_${node.nodeId}`);
            if (linkElement) linkElement.className.baseVal = 'LinkAnimation';
        }
        await sleep(750);
    }
    unfreezeButtons();
};
//   For a hard coded sequence
const simulate = async () => {
    freezeButtons();
    const list = [15, 7, 25, 4, 10, 20, 30, 2];
    for (let i = 0; i < list.length; i++) {
      document.getElementById('InsertNodeField').value = list[i];
      await addNode();
    }
    unfreezeButtons();
  };
document.getElementById('InsertButton').addEventListener('click', addNode);
document.getElementById('DeleteButton').addEventListener('click', deleteNode);
document.getElementById('SimulateButton').addEventListener('click', simulate);


// If during writing in insertion or deletion input field, user presses enter key then click on insertion/deletion button.
document.getElementById('InsertNodeField').addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        document.getElementById('InsertButton').click();
    }
});
document.getElementById('DeleteNodeField').addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        document.getElementById('DeleteButton').click();
    }
});