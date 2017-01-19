'use strict'


const WorldMap = [];
const turnHistory = [];


const dimensions = [5, 5],
    scores = [0, 0],
    arrowTypes = ['green', 'red'];

const MAX_VIEWPORT_WIDTH = 550,
    width = window.innerWidth < MAX_VIEWPORT_WIDTH ? window.innerWidth - 20 : MAX_VIEWPORT_WIDTH - 20;

const $arrowTmpl = $('#arrowTmpl').find('.a_w'),
    $scores = [$('#greenScore'), $('#redScore')],
    $playground = $('#playGound').css({
        width: width,
        height: width / dimensions[1] * dimensions[0],
        maxWidth: '340px',
        maxHeight: '340px'
    })
const containerDimensions = [$playground.height(), $playground.width()]

$('.scoreView').css('width', width);


function movement(pos, currentChain, callbackAll) { //adding functionality to the prototype

    const arrow = WorldMap[pos[0]][pos[1]].arrow;
    const $arrow = WorldMap[pos[0]][pos[1]].$arrow;

    var posNext = pos.slice(),
        axis = arrow.dir === 'u' || arrow.dir === 'd' ? 0 : 1;

    WorldMap[pos[0]][pos[1]].score = {
        type: arrow.type,
        value: currentChain.length
    };
    WorldMap[pos[0]][pos[1]].empty = true;


    while (WorldMap[arrow.dir === 'u' || arrow.dir === 'l' ? --posNext[axis] : ++posNext[axis]] && 
						WorldMap[posNext[0]][posNext[1]] && 
						WorldMap[posNext[0]][posNext[1]].empty);


    const promise = new Promise(function(resolve, reject) {
        $arrow.velocity({
            top: posNext[0] * containerDimensions[0] / dimensions[0] + 'px',
            'left': posNext[1] * containerDimensions[1] / dimensions[1] + 'px',
            opacity: 0
        }, 450, () => {
            const nextChain = currentChain.concat([WorldMap[pos[0]][pos[1]]]);
            if (WorldMap[posNext[0]] && WorldMap[posNext[0]][posNext[1]] && WorldMap[posNext[0]][posNext[1]].arrow) {
                movement(posNext, nextChain, callbackAll);
            } else {
                if (callbackAll) callbackAll({
                    chain: nextChain
                })
            }
            resolve({ chain: nextChain });
        });
    });


    WorldMap[pos[0]][pos[1]].$cell.text(currentChain.length).css('color', arrowTypes[arrow.type]);
    scores[arrow.type] = scores[arrow.type] + currentChain.length;
    $scores[arrow.type].text(scores[arrow.type]);

    $('.scoreDiff').css('color', scores[0] - scores[1] > 0 ? 'green' : 'red')
        .text(Math.abs(scores[0] - scores[1]));


    return promise;
}

function turn(pos) {
    return new Promise((resolve, reject) => {
        movement(pos, [], (res) => resolve(res));
    });
}


function createWorld() {
    const world = [],
        arrowDirs = ['u', 'd', 'l', 'r'];

    const cellsNum = dimensions[0] * dimensions[1];
    const arrowsTypesArray = Array.from({ length: cellsNum }, (v, k) => k < cellsNum / 2 ? 0 : 1);

    for (var row = 0; row < dimensions[0]; ++row) {

        world[row] = [];

        for (var column = 0; column < dimensions[1]; ++column) {
            world[row].push({
                arrow: {
                    dir: arrowDirs[Math.floor(Math.random() * arrowDirs.length)],
                    type: (function() {
                        const elementArray = arrowsTypesArray.splice(
                            Math.floor(Math.random() * arrowsTypesArray.length),
                            1);

                        return elementArray[0];
                    }())
                },
                pos: [
                    [row],
                    [column]
                ],
                empty: false
            });
        }
    }
    return world;
}


function udateWorldModel(world) {

    for (let rowInt = 0; rowInt < world.length; rowInt++) {
        WorldMap[rowInt] = [];
        for (let columnInt = 0; columnInt < world.length; columnInt++) {
            let arrow = world[rowInt][columnInt].arrow;
            let pos = [rowInt, columnInt];

            WorldMap[rowInt][columnInt] = {
                arrow: arrow,
                $arrow: $arrowTmpl.clone().css({
                        'top': pos[0] * containerDimensions[0] / dimensions[0] + 'px',
                        'left': pos[1] * containerDimensions[1] / dimensions[1] + 'px',
                        width: containerDimensions[1] / dimensions[1] + 'px',
                        height: containerDimensions[0] / dimensions[0] + 'px'
                    }).addClass(arrow.dir + ' ' + arrowTypes[arrow.type])
                    .attr('data-pos', pos.join(';'))
                    .appendTo($playground),
                pos,
                $cell: $(
                    `<div class="c"></div>`
                ).css({
                    width: containerDimensions[1] / dimensions[1] + 'px',
                    height: containerDimensions[1] / dimensions[1] + 'px',
                    'font-size': containerDimensions[1] / dimensions[1] * 0.5 + 'px'
                }).appendTo($playground)
            }
        }
    }
}

udateWorldModel(createWorld());




function touchCell(ev) {
    var pos = this.dataset.pos.split(";");

    //send data to the server

    if (WorldMap[pos[0]][pos[1]]) {

        const arrowDirs = ['u', 'd', 'l', 'r'];
        turn(pos)
            .then((res) => {
                console.log(res);

                //compare from world from the server
                res.chain.forEach(el => {
                    el.arrow.dir = arrowDirs[Math.floor(Math.random() * arrowDirs.length)]
                    el.arrow.type = [0, 1][Math.floor(Math.random() * [0, 1].length)]
                    el.$arrow.css({
                            'top': el.pos[0] * containerDimensions[0] / dimensions[0] + 'px',
                            'left': el.pos[1] * containerDimensions[1] / dimensions[1] + 'px',
                            width: containerDimensions[1] / dimensions[1] + 'px',
                            height: containerDimensions[0] / dimensions[0] + 'px',
                            opacity: 1
                        })
                        .removeClass(arrowDirs.join(' '))
                        .removeClass(arrowTypes.join(' '))
                        .addClass(el.arrow.dir + ' ' + arrowTypes[el.arrow.type]);
                    el.empty = false;
                });

                $playground.one('click', '.a_w', touchCell);
            });
    }
}


$playground.one('click', '.a_w', touchCell);
