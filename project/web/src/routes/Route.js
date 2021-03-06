import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

import ArtistStudioLayout from '~/pages/_layouts/ArtistStudio';
import ClientLayout from '../pages/_layouts/Client';
import DefaultLayout from '../pages/_layouts/Default';

import { store } from '~/store';

export default function RouteWrapper({
  component: Component,
  isPrivate,
  ...rest
}) {
  const { signed } = store.getState().auth;
  const { profile } = store.getState().user;
  const client = profile ? profile.role === 'CUSTOMER' : false;

  if (!signed && isPrivate) {
    return <Redirect to="/" />;
  }

  if (signed && !isPrivate) {
    return <Redirect to="/profile" />;
  }

  const Layout = signed ? (client ? ClientLayout : ArtistStudioLayout) : DefaultLayout;

  return (
    <Route
      {...rest}
      render={props => (
        <Layout>
          <Component {...props} />
        </Layout>
      )}
    />
  );
}

RouteWrapper.propTypes = {
  isPrivate: PropTypes.bool,
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func])
    .isRequired,
};

RouteWrapper.defaultProps = {
  isPrivate: false,
};
