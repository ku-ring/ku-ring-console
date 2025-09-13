import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import classes from './LeftNavigation.module.css';

export default function LeftNavigation() {
  const [expandedMenus, setExpandedMenus] = useState({});

  const navItems = [
    {
      id: 'feedbacks',
      label: '피드백 확인',
      icon: '📝',
      hasSubmenu: true,
      submenu: [
        { path: '/dashboard/feedbacks', label: '피드백 확인' },
        { path: '/dashboard/reports', label: '신고 확인' }
      ]
    },
    {
      id: 'notices',
      label: '알림 발송',
      icon: '📢',
      hasSubmenu: true,
      submenu: [
        { path: '/dashboard/task-notices', label: '테스트 알림' },
        { path: '/dashboard/custom-notices', label: '실제 알림' },
        { path: '/dashboard/scheduled-alerts', label: '예약 알림' }
      ]
    }
  ];

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  return (
    <nav className={classes.navigation}>
      <div className={classes.container}>
        <h2 className={classes.title}>관리 메뉴</h2>
        <ul className={classes.navList}>
          {navItems.map((item) => (
            <li key={item.id} className={classes.navItem}>
              <div className={classes.navItemContainer}>
                <button
                  className={classes.navButton}
                  onClick={() => toggleSubmenu(item.id)}
                >
                  <span className={classes.icon}>{item.icon}</span>
                  <span className={classes.label}>{item.label}</span>
                  <span className={`${classes.arrow} ${expandedMenus[item.id] ? classes.arrowExpanded : ''}`}>
                    ▼
                  </span>
                </button>
                {item.hasSubmenu && expandedMenus[item.id] && (
                  <ul className={classes.submenu}>
                    {item.submenu.map((subItem) => (
                      <li key={subItem.path} className={classes.submenuItem}>
                        <NavLink
                          to={subItem.path}
                          className={({ isActive }) => 
                            isActive ? classes.submenuLinkActive : classes.submenuLinkInactive
                          }
                        >
                          {subItem.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
