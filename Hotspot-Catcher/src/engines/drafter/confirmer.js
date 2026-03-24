const readline = require('readline');

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function promptChoice(promptText) {
  return new Promise((resolve) => {
    const rl = createInterface();
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmDraft(candidates) {
  console.log('\n请输入编号确认（1-' + candidates.length + '），或输入 e 编辑: ');
  const choice = await promptChoice('> ');

  if (choice.toLowerCase() === 'e') {
    console.log('编辑功能待实现');
    return null;
  }

  const index = parseInt(choice) - 1;
  if (index >= 0 && index < candidates.length) {
    return candidates[index];
  }

  console.log('无效选择，请重试');
  return confirmDraft(candidates);
}

module.exports = { confirmDraft, promptChoice, createInterface };