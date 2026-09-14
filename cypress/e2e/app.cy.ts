describe('FileShare — Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the main page', () => {
    cy.contains('Обмен файлами').should('be.visible');
    cy.contains('Перетащите файл сюда').should('be.visible');
  });

  it('should have upload area', () => {
    cy.get('input[type="file"]').should('exist');
    cy.contains('Выбрать файл').should('be.visible');
  });

  it('should display info cards', () => {
    cy.contains('Быстро').should('be.visible');
    cy.contains('Анонимно').should('be.visible');
    cy.contains('Срок жизни').should('be.visible');
  });

  it('should navigate to history page', () => {
    cy.contains('История').click();
    cy.url().should('include', '/history');
    cy.contains('История сессии').should('be.visible');
  });

  it('should navigate to text share page', () => {
    cy.contains('Текст').click();
    cy.url().should('include', '/text-share');
    cy.contains('Обмен текстом').should('be.visible');
  });
});

describe('FileShare — Text Share', () => {
  beforeEach(() => {
    cy.visit('/text-share');
  });

  it('should display text share form', () => {
    cy.get('textarea').should('be.visible');
    cy.contains('Создать ссылку').should('be.visible');
  });

  it('should disable submit when content is empty', () => {
    cy.contains('Создать ссылку').should('be.disabled');
  });

  it('should enable submit when content is entered', () => {
    cy.get('textarea').type('Hello world');
    cy.contains('Создать ссылку').should('not.be.disabled');
  });
});

describe('FileShare — History Page', () => {
  beforeEach(() => {
    cy.visit('/history');
  });

  it('should display empty state', () => {
    cy.contains('Нет загруженных файлов').should('be.visible');
  });

  it('should have tabs for files and texts', () => {
    cy.contains('Файлы').should('be.visible');
    cy.contains('Тексты').should('be.visible');
  });

  it('should switch between tabs', () => {
    cy.contains('Тексты').click();
    cy.contains('Нет общих текстов').should('be.visible');
  });
});

describe('FileShare — Admin Setup', () => {
  beforeEach(() => {
    cy.visit('/admin/setup');
  });

  it('should display admin setup form', () => {
    cy.contains('Создание администратора').should('be.visible');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('have.length.at.least', 2);
  });

  it('should show password requirements', () => {
    cy.contains('Минимум 12 символов').should('be.visible');
    cy.contains('Заглавная буква').should('be.visible');
    cy.contains('Строчная буква').should('be.visible');
    cy.contains('Цифра').should('be.visible');
    cy.contains('Спецсимвол').should('be.visible');
  });

  it('should disable submit with invalid data', () => {
    cy.contains('Создать администратора').should('be.disabled');
  });
});
